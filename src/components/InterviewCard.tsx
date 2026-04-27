import { AudioPlayer } from "./AudioPlayer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { Link } from "react-router-dom";

export const InterviewCard = ({ iv }: { iv: any }) => {
  const answers = (iv.interview_answers ?? []).filter((a: any) => a.answer && a.interview_questions).sort((a: any, b: any) => a.interview_questions.question_order - b.interview_questions.question_order);
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <Avatar><AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials(iv.interviewee_name)}</AvatarFallback></Avatar>
        <div className="min-w-0">
          <div className="font-semibold truncate">{iv.interviewee_name}</div>
          <div className="text-sm text-muted-foreground truncate">
            {iv.interviewee_role}
            {iv.companies && <> · <Link to={`/companies/${iv.companies.slug}`} className="hover:text-foreground underline-offset-2 hover:underline">{iv.companies.name}</Link></>}
            {iv.careers && <> · <Link to={`/careers/${iv.careers.slug}`} className="hover:text-foreground underline-offset-2 hover:underline">{iv.careers.title}</Link></>}
          </div>
        </div>
      </div>
      {iv.audio_url && <div className="mt-4"><AudioPlayer src={iv.audio_url} /></div>}
      {answers.length > 0 && (
        <dl className="mt-4 space-y-3">
          {answers.slice(0, 6).map((a: any, i: number) => (
            <div key={i}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-primary">{a.interview_questions.short_label}</dt>
              <dd className="text-sm text-foreground/90 mt-0.5">{a.answer}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
};
