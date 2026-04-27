import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Mic, Upload, X } from "lucide-react";

const MAX_AUDIO_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/webm", "audio/ogg"];

const schema = z.object({
  interviewee_name: z.string().trim().min(1, "Required").max(120),
  interviewee_role: z.string().trim().min(1, "Required").max(120),
  career_id: z.string().uuid().nullable(),
});

const InterviewNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    interviewee_name: "",
    interviewee_role: "",
    career_id: "none",
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { data: company, isLoading: loadingCompany } = useQuery({
    enabled: !!user,
    queryKey: ["my-company-min", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name, status").eq("owner_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["interview-questions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("interview_questions").select("*").order("question_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: careers = [] } = useQuery({
    queryKey: ["careers-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("careers").select("id, title").eq("status", "published").order("title");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const onFile = (f: File | null) => {
    if (!f) { setFile(null); setPreviewUrl(null); return; }
    if (!ALLOWED_TYPES.includes(f.type)) { toast.error("Unsupported audio type. Use MP3, WAV, M4A, OGG, or WEBM."); return; }
    if (f.size > MAX_AUDIO_BYTES) { toast.error("Audio must be under 50 MB."); return; }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const onSubmit = async (submitForReview: boolean) => {
    if (!user || !company) return;
    const parsed = schema.safeParse({
      interviewee_name: form.interviewee_name,
      interviewee_role: form.interviewee_role,
      career_id: form.career_id === "none" ? null : form.career_id,
    });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }

    setSubmitting(true);
    try {
      let audio_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp3";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("interview-audio").upload(path, file, {
          contentType: file.type, upsert: false,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("interview-audio").getPublicUrl(path);
        audio_url = pub.publicUrl;
      }

      const { data: interview, error: insErr } = await supabase.from("interviews").insert({
        company_id: company.id,
        career_id: parsed.data.career_id,
        interviewee_name: parsed.data.interviewee_name,
        interviewee_role: parsed.data.interviewee_role,
        audio_url,
        status: submitForReview ? "pending" : "draft",
        created_by: user.id,
      }).select("id").single();
      if (insErr) throw insErr;

      const rows = Object.entries(answers)
        .map(([qid, a]) => ({ interview_id: interview.id, question_id: qid, answer: a.trim() }))
        .filter(r => r.answer.length > 0);
      if (rows.length) {
        const { error: aErr } = await supabase.from("interview_answers").insert(rows);
        if (aErr) throw aErr;
      }

      toast.success(submitForReview ? "Submitted for review" : "Saved as draft");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.message ?? "Could not save interview");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCompany) return <div className="container py-16 grid place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  if (!company) return (
    <section className="container py-16 max-w-xl">
      <h1 className="text-2xl font-bold">Set up your company first</h1>
      <p className="text-muted-foreground mt-2">You need a company profile before you can record interviews.</p>
      <Button className="mt-4" onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
    </section>
  );

  return (
    <>
      <SEO title="Record an interview" description="Upload an audio interview and answer structured questions." />
      <section className="container py-10 max-w-3xl">
        <div className="flex items-center gap-2 text-primary mb-2"><Mic className="h-5 w-5" /><span className="text-xs font-medium uppercase tracking-wide">New interview</span></div>
        <h1 className="text-3xl md:text-4xl font-bold">Record an interview</h1>
        <p className="text-muted-foreground mt-1">Upload audio from a team member and answer the structured questions students ask most.</p>

        <div className="mt-8 space-y-8">
          {/* Interviewee */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Interviewee name *</Label>
              <Input id="name" maxLength={120} value={form.interviewee_name} onChange={(e) => setForm({ ...form, interviewee_name: e.target.value })} placeholder="Maria Lopez" />
            </div>
            <div>
              <Label htmlFor="role">Role / title *</Label>
              <Input id="role" maxLength={120} value={form.interviewee_role} onChange={(e) => setForm({ ...form, interviewee_role: e.target.value })} placeholder="Registered Nurse" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="career">Linked career (optional)</Label>
              <Select value={form.career_id} onValueChange={(v) => setForm({ ...form, career_id: v })}>
                <SelectTrigger id="career"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {careers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Audio */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-bold mb-1">Audio file</h2>
            <p className="text-sm text-muted-foreground mb-4">MP3, WAV, M4A, OGG or WEBM. Max 50 MB.</p>
            {!file ? (
              <button type="button" onClick={() => fileRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-border bg-surface px-6 py-10 text-center hover:border-primary hover:bg-primary/5 transition">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                <div className="mt-2 font-medium">Click to upload audio</div>
                <div className="text-xs text-muted-foreground">or drop a file</div>
              </button>
            ) : (
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onFile(null)} aria-label="Remove file"><X className="h-4 w-4" /></Button>
                </div>
                {previewUrl && <audio controls src={previewUrl} className="mt-3 w-full" />}
              </div>
            )}
            <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          </div>

          {/* Structured questions */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-bold">Structured answers</h2>
            <p className="text-sm text-muted-foreground mb-5">Fill in what the interviewee said. All optional, but more answers = more discoverable.</p>
            <div className="space-y-5">
              {questions.map((q: any) => (
                <div key={q.id}>
                  <Label htmlFor={q.id} className="text-sm font-semibold">{q.question_order}. {q.short_label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">{q.prompt}</p>
                  <Textarea id={q.id} rows={3} maxLength={1500} value={answers[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder="Type the answer…" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => onSubmit(false)} disabled={submitting} variant="outline">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save draft"}
            </Button>
            <Button onClick={() => onSubmit(true)} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for review"}
            </Button>
            <p className="text-xs text-muted-foreground">An admin reviews interviews before they appear publicly.</p>
          </div>
        </div>
      </section>
    </>
  );
};
export default InterviewNew;
