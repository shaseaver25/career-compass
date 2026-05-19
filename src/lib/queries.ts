import { supabase } from "@/integrations/supabase/client";

export async function fetchPublishedCareers() {
  const { data, error } = await supabase
    .from("careers")
    .select("id, slug, title, short_description, median_salary, growth_outlook, industry, education_level, skills, featured, primary_cluster_id")
    .eq("status", "published")
    .order("title");
  if (error) throw error;
  const careers = data ?? [];
  const ids = Array.from(new Set(careers.map((c: any) => c.primary_cluster_id).filter(Boolean)));
  if (ids.length === 0) return careers;
  const { data: clusters } = await supabase.from("acte_clusters").select("id, name, slug").in("id", ids);
  const map = new Map((clusters ?? []).map((c: any) => [c.id, c]));
  return careers.map((c: any) => ({ ...c, primary_cluster: c.primary_cluster_id ? map.get(c.primary_cluster_id) ?? null : null }));
}

export async function fetchPublishedCareersByCluster(clusterSlug: string, pathwaySlug?: string | null) {
  const { data: cluster, error: cErr } = await supabase
    .from("acte_clusters")
    .select("id, name, slug, grouping_id, is_cross_cutting, acte_cluster_groupings(name, color_hex)")
    .eq("slug", clusterSlug)
    .maybeSingle();
  if (cErr) throw cErr;
  if (!cluster) return { careers: [], cluster: null, pathway: null, unknownCluster: true as const, unknownPathway: false as const };

  let pathway: any = null;
  if (pathwaySlug) {
    const { data: sc, error: sErr } = await supabase
      .from("acte_sub_clusters")
      .select("id, name, slug, cluster_id")
      .eq("slug", pathwaySlug)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!sc) return { careers: [], cluster, pathway: null, unknownCluster: false as const, unknownPathway: true as const };
    pathway = sc;
  }

  const { data: tagRows, error: tErr } = await supabase
    .from("career_cluster_tags").select("career_id").eq("cluster_id", cluster.id);
  if (tErr) throw tErr;
  const taggedIds = (tagRows ?? []).map((r: any) => r.career_id as string);

  let query = supabase
    .from("careers")
    .select("id, slug, title, short_description, median_salary, growth_outlook, industry, education_level, skills, featured, primary_cluster_id, primary_sub_cluster_id")
    .eq("status", "published");

  if (taggedIds.length > 0) {
    query = query.or(`primary_cluster_id.eq.${cluster.id},id.in.(${taggedIds.join(",")})`);
  } else {
    query = query.eq("primary_cluster_id", cluster.id);
  }
  const { data, error } = await query.order("title");
  if (error) throw error;
  let careers = data ?? [];
  // Attach primary_cluster (name, slug) — current filtered cluster is the most common one
  careers = careers.map((c: any) => ({ ...c, primary_cluster: c.primary_cluster_id === cluster.id ? { id: cluster.id, name: cluster.name, slug: cluster.slug } : null }));
  const missingIds = Array.from(new Set(careers.filter((c: any) => !c.primary_cluster && c.primary_cluster_id).map((c: any) => c.primary_cluster_id)));
  if (missingIds.length) {
    const { data: extra } = await supabase.from("acte_clusters").select("id, name, slug").in("id", missingIds);
    const m = new Map((extra ?? []).map((c: any) => [c.id, c]));
    careers = careers.map((c: any) => c.primary_cluster ? c : ({ ...c, primary_cluster: c.primary_cluster_id ? m.get(c.primary_cluster_id) ?? null : null }));
  }

  if (pathway) {
    const { data: subTagRows } = await supabase
      .from("career_sub_cluster_tags").select("career_id").eq("sub_cluster_id", pathway.id);
    const subTaggedIds = new Set((subTagRows ?? []).map((r: any) => r.career_id as string));
    careers = careers.filter((c: any) => c.primary_sub_cluster_id === pathway.id || subTaggedIds.has(c.id));
  }

  return { careers, cluster, pathway, unknownCluster: false as const, unknownPathway: false as const };
}

export async function fetchCareerFieldsAndClusters() {
  const { data: fields, error: fErr } = await supabase
    .from("acte_cluster_groupings")
    .select("id, code, name, slug:code, color_hex, description, display_order")
    .order("display_order");
  if (fErr) throw fErr;
  const { data: clusters, error: cErr } = await supabase
    .from("acte_clusters")
    .select("id, code, name, slug, description, grouping_id, is_cross_cutting, display_order")
    .order("display_order");
  if (cErr) throw cErr;
  const { data: subs, error: sErr } = await supabase
    .from("acte_sub_clusters")
    .select("id, code, name, slug, cluster_id, display_order")
    .order("display_order");
  if (sErr) throw sErr;
  return {
    fields: fields ?? [],
    clusters: clusters ?? [],
    subClusters: subs ?? [],
  };
}

export async function fetchPublishedCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select("id, slug, name, description, industry, logo_emoji, logo_url, company_locations(city, state, is_primary), company_careers(career_id)")
    .eq("status", "published")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((c: any) => {
    const loc = c.company_locations?.find((l: any) => l.is_primary) ?? c.company_locations?.[0];
    return { ...c, city: loc?.city ?? null, state: loc?.state ?? null, careers_count: c.company_careers?.length ?? 0 };
  });
}

export async function fetchCareerBySlug(slug: string) {
  const { data: career, error } = await supabase.from("careers").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw error;
  if (!career) return null;
  const [{ data: steps }, { data: links }, { data: interviews }] = await Promise.all([
    supabase.from("pathway_steps").select("*").eq("career_id", career.id).order("step_order"),
    supabase.from("company_careers").select("companies(id, slug, name, industry, logo_emoji, logo_url, description, status, company_locations(city, state, is_primary))").eq("career_id", career.id),
    supabase.from("interviews").select("id, interviewee_name, interviewee_role, audio_url, companies(slug, name), interview_answers(answer, interview_questions(question_order, prompt, short_label))").eq("career_id", career.id).eq("status", "published"),
  ]);
  const companies = (links ?? []).map((l: any) => l.companies).filter((c: any) => c && c.status === "published").map((c: any) => {
    const loc = c.company_locations?.find((l: any) => l.is_primary) ?? c.company_locations?.[0];
    return { ...c, city: loc?.city ?? null, state: loc?.state ?? null };
  });
  return { career, steps: steps ?? [], companies, interviews: interviews ?? [] };
}

export async function fetchCompanyBySlug(slug: string) {
  const { data: company, error } = await supabase.from("companies").select("*, company_locations(*)").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw error;
  if (!company) return null;
  const [{ data: videos }, { data: links }, { data: interviews }] = await Promise.all([
    supabase.from("videos").select("*").eq("company_id", company.id),
    supabase.from("company_careers").select("careers(id, slug, title, short_description, median_salary, growth_outlook, industry, status)").eq("company_id", company.id),
    supabase.from("interviews").select("id, interviewee_name, interviewee_role, audio_url, careers(slug, title), interview_answers(answer, interview_questions(question_order, prompt, short_label))").eq("company_id", company.id).eq("status", "published"),
  ]);
  const careers = (links ?? []).map((l: any) => l.careers).filter((c: any) => c && c.status === "published");
  return { company, videos: videos ?? [], careers, interviews: interviews ?? [] };
}

// ---------- Perkins consortia ----------
export type ConsortiumRow = {
  id: string; code: string; name: string; region_label: string;
  anchor_college: string; is_metro: boolean; display_order: number;
};

export async function fetchConsortia(): Promise<ConsortiumRow[]> {
  const { data, error } = await supabase
    .from("mn_perkins_consortia")
    .select("id, code, name, region_label, anchor_college, is_metro, display_order")
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as ConsortiumRow[];
}

/** Look up which published companies + careers are tied to a consortium (by code). */
export async function fetchConsortiumMembership(code: string) {
  const { data: consortium } = await supabase
    .from("mn_perkins_consortia")
    .select("id, code, name, region_label, anchor_college, is_metro")
    .eq("code", code).maybeSingle();
  if (!consortium) return { consortium: null, companyIds: [] as string[], careerIds: [] as string[] };

  const { data: locs } = await supabase
    .from("company_locations")
    .select("company_id")
    .eq("consortium_id", consortium.id);
  const rawCompanyIds = Array.from(new Set((locs ?? []).map((l: any) => l.company_id as string)));
  if (rawCompanyIds.length === 0) return { consortium, companyIds: [], careerIds: [] };

  const { data: pubCos } = await supabase
    .from("companies").select("id").in("id", rawCompanyIds).eq("status", "published");
  const companyIds = (pubCos ?? []).map((c: any) => c.id as string);
  if (companyIds.length === 0) return { consortium, companyIds: [], careerIds: [] };

  const { data: ccs } = await supabase
    .from("company_careers").select("career_id").in("company_id", companyIds);
  const candidateCareerIds = Array.from(new Set((ccs ?? []).map((cc: any) => cc.career_id as string)));
  if (candidateCareerIds.length === 0) return { consortium, companyIds, careerIds: [] };

  const { data: pubCareers } = await supabase
    .from("careers").select("id").in("id", candidateCareerIds).eq("status", "published");
  const careerIds = (pubCareers ?? []).map((c: any) => c.id as string);

  return { consortium, companyIds, careerIds };
}

/** Detailed preview used in the map's side panel. */
export async function fetchConsortiumPreview(code: string) {
  const { consortium, companyIds, careerIds } = await fetchConsortiumMembership(code);
  if (!consortium) return { consortium: null, companies: [], careers: [] };

  let companies: any[] = [];
  if (companyIds.length) {
    const { data } = await supabase
      .from("companies")
      .select("id, slug, name, industry, logo_emoji, logo_url, description")
      .in("id", companyIds).order("name");
    companies = data ?? [];
  }
  let careers: any[] = [];
  if (careerIds.length) {
    const { data } = await supabase
      .from("careers")
      .select("id, slug, title, short_description, median_salary, growth_outlook, industry, primary_cluster_id")
      .in("id", careerIds).order("title");
    careers = data ?? [];
    const clusterIds = Array.from(new Set(careers.map((c: any) => c.primary_cluster_id).filter(Boolean)));
    if (clusterIds.length) {
      const { data: cls } = await supabase.from("acte_clusters").select("id, name, slug").in("id", clusterIds);
      const m = new Map((cls ?? []).map((c: any) => [c.id, c]));
      careers = careers.map((c: any) => ({ ...c, primary_cluster: c.primary_cluster_id ? m.get(c.primary_cluster_id) ?? null : null }));
    }
  }
  return { consortium, companies, careers };
}
