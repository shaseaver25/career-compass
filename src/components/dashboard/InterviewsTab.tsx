import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Mic, Star } from "lucide-react";

export function InterviewsTab({ companyId }: { companyId: string }) {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["my-interviews", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews").select("*")
        .eq("company_id", companyId)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Mic className="h-5 w-5 text-primary" /> Interviews</h2>
          <p className="text-sm text-muted-foreground">Audio and video stories from your team. Featured interviews are pinned at the top of your public page.</p>
        </div>
        <Button asChild><Link to="/dashboard/interviews/new"><Plus className="h-4 w-4 mr-1.5" /> New interview</Link></Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-muted-foreground">No interviews yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {rows.map((i: any) => (
            <div key={i.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="font-semibold flex items-center gap-2">
                  {i.interviewee_name}
                  {i.featured && <Star className="h-4 w-4 text-primary fill-primary" />}
                </div>
                <div className="text-xs text-muted-foreground">{i.interviewee_role}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant={i.status === "published" ? "default" : "secondary"}>{i.status}</Badge>
                  {i.video_url && <Badge variant="outline">Video</Badge>}
                  {i.audio_url && <Badge variant="outline">Audio</Badge>}
                  {(i.key_topics ?? []).slice(0, 3).map((t: string) => (
                    <Badge key={t} variant="outline">{t.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}