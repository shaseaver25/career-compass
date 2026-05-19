import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";
import { Loader2, Mail, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const redirect = params.get("redirect") ?? "/dashboard";
  const { user, loading: authLoading } = useAuth();
  const processingCallback =
    typeof window !== "undefined" &&
    (window.location.hash.includes("access_token") || /[?&]code=/.test(window.location.search));
  useEffect(() => {
    if (!authLoading && user) navigate(redirect, { replace: true });
  }, [user, authLoading, redirect, navigate]);
  if (authLoading || processingCallback) {
    return (
      <section className="container py-32 grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </section>
    );
  }
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}${redirect}` } });
    setLoading(false);
    if (error) toast.error(error.message); else { setSent(true); toast.success("Check your email for the sign-in link"); }
  };
  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${redirect}`,
    });
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
  };
  return (
    <>
      <SEO title="Sign in" description="Sign in to manage your company profile and interviews." path="/auth" />
      <section className="container py-16 grid place-items-center">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-card">
          <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-hero text-primary-foreground mb-4"><Sparkles className="h-6 w-6" /></div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in with a magic link. No passwords.</p>
          {sent ? (
            <div className="mt-6 rounded-xl bg-secondary p-4 text-sm">
              <Mail className="inline h-4 w-4 mr-1 text-primary" />We sent a sign-in link to <strong>{email}</strong>. Open it on this device.
              <div className="mt-3 flex gap-2"><Button variant="outline" size="sm" onClick={() => setSent(false)}>Use a different email</Button><Button variant="ghost" size="sm" onClick={() => navigate("/")}>Back to home</Button></div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
                Continue with Google
              </Button>
              <div className="relative my-2 text-center text-xs text-muted-foreground">
                <span className="bg-card px-2 relative z-10">or</span>
                <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
              </div>
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending…" : "Send magic link"}</Button>
              <p className="text-xs text-muted-foreground">Browsing? You don't need an account. Sign-in is for company reps and admins.</p>
            </form>
          )}
        </div>
      </section>
    </>
  );
};
export default Auth;
