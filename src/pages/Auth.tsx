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
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [isSignup, setIsSignup] = useState(false);
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
    if (mode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}${redirect}` } });
      setLoading(false);
      if (error) toast.error(error.message); else { setSent(true); toast.success("Check your email for the sign-in link"); }
      return;
    }
    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}${redirect}` },
      });
      setLoading(false);
      if (error) toast.error(error.message);
      else toast.success("Account created. Signing you in…");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error && /invalid login credentials/i.test(error.message)) {
      // No account yet — auto-create one with the same password.
      const { error: signUpErr } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}${redirect}` },
      });
      setLoading(false);
      if (signUpErr) toast.error(signUpErr.message);
      else toast.success("Account created. Signing you in…");
      return;
    }
    setLoading(false);
    if (error) toast.error(error.message);
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
              {mode === "password" && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Working…" : mode === "magic" ? "Send magic link" : isSignup ? "Create account" : "Sign in"}
              </Button>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {mode === "password" ? (
                  <>
                    <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => setIsSignup(s => !s)}>
                      {isSignup ? "Have an account? Sign in" : "New here? Create an account"}
                    </button>
                    <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => setMode("magic")}>
                      Use a magic link instead
                    </button>
                  </>
                ) : (
                  <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => setMode("password")}>
                    Use email + password instead
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
};
export default Auth;
