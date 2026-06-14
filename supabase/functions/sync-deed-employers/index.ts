import { createClient } from "npm:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const DEED_URL = "https://mn.gov/deed/assets/top-companies-employers_tcm1045-647715.xlsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-triggered-by",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startedAt = Date.now();
  const triggeredBy = req.headers.get("x-triggered-by") || "cron";

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });

  try {
    const headRes = await fetch(DEED_URL, { method: "HEAD" });
    const lastModifiedRaw = headRes.headers.get("last-modified");
    const lastModified = lastModifiedRaw ? new Date(lastModifiedRaw).toISOString() : null;

    const res = await fetch(DEED_URL);
    if (!res.ok) throw new Error(`DEED fetch failed: ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());

    const hashBuf = await crypto.subtle.digest("SHA-256", buf);
    const hashHex = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { data: lastSync } = await sb
      .from("deed_sync_log")
      .select("source_file_hash, status")
      .eq("status", "success")
      .order("ran_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSync?.source_file_hash === hashHex) {
      await sb.from("deed_sync_log").insert({
        source_file_hash: hashHex,
        source_last_modified: lastModified,
        status: "skipped_unchanged",
        triggered_by: triggeredBy,
        duration_ms: Date.now() - startedAt,
      });
      return json({ status: "skipped_unchanged" });
    }

    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets["Top Employers"] ?? wb.Sheets[wb.SheetNames[0]];
    if (!ws) throw new Error("Missing worksheet");

    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    const employers = rows
      .slice(2)
      .filter((r) => r && r[0] && r[1] != null && r[2] != null)
      .map((r) => ({
        organization: String(r[0]).trim(),
        rank: Number(r[1]),
        mn_employees: Math.round(Number(r[2])),
        business_description: r[3] ? String(r[3]).trim() : null,
      }));

    if (employers.length === 0) {
      throw new Error("Parsed 0 employers — file format may have changed");
    }

    const { data: existing } = await sb
      .from("deed_employers")
      .select("organization, mn_employees, rank, business_description, removed_from_source");
    const existingMap = new Map((existing ?? []).map((e: any) => [e.organization, e]));

    const now = new Date().toISOString();
    let added = 0, updated = 0, unchanged = 0;
    const seen = new Set<string>();
    const upserts: any[] = [];

    for (const emp of employers) {
      seen.add(emp.organization);
      const found: any = existingMap.get(emp.organization);
      const row = {
        ...emp,
        last_seen_at: now,
        removed_from_source: false,
        source_last_modified: lastModified,
      };
      if (!found) {
        added++;
        upserts.push(row);
      } else {
        const changed =
          found.mn_employees !== emp.mn_employees ||
          found.rank !== emp.rank ||
          found.business_description !== emp.business_description ||
          found.removed_from_source;
        if (changed) updated++;
        else unchanged++;
        upserts.push(row);
      }
    }

    // Bulk upsert in chunks
    const CHUNK = 500;
    for (let i = 0; i < upserts.length; i += CHUNK) {
      const { error } = await sb
        .from("deed_employers")
        .upsert(upserts.slice(i, i + CHUNK), { onConflict: "organization" });
      if (error) throw error;
    }

    // Bulk mark removed
    const toRemove: string[] = [];
    for (const org of existingMap.keys()) {
      if (!seen.has(org) && !(existingMap.get(org) as any).removed_from_source) {
        toRemove.push(org);
      }
    }
    let removed = 0;
    if (toRemove.length > 0) {
      const { data } = await sb
        .from("deed_employers")
        .update({ removed_from_source: true })
        .in("organization", toRemove)
        .select("organization");
      removed = data?.length ?? 0;
    }

    await sb.from("deed_sync_log").insert({
      source_file_hash: hashHex,
      source_last_modified: lastModified,
      rows_added: added,
      rows_updated: updated,
      rows_removed: removed,
      rows_unchanged: unchanged,
      status: "success",
      triggered_by: triggeredBy,
      duration_ms: Date.now() - startedAt,
    });

    return json({ status: "success", added, updated, removed, unchanged, hash: hashHex });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await sb.from("deed_sync_log").insert({
      status: "error",
      error_message: msg,
      triggered_by: triggeredBy,
      duration_ms: Date.now() - startedAt,
    });
    return json({ status: "error", error: msg }, 500);
  }
});