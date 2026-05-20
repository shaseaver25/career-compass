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

type Mode = "sign-in" | "sign-up" | "magic";

function friendlyError(message: string, context: Mode): { text: string; suggestSignIn?: boolean } {
  const m = message.toLowerCase();
  if (m.includes("user already registered")) {
    return {
      text: "An account with this email already exists. Try signing in instead.",
      suggestSignIn: true,
    };
  }
  if (m.includes("invalid login credentials")) {
    return { text: "Email or password didn't match. Double-check the email, or use a magic link if you don't remember your password." };
  }
  if (m.includes("email not confirmed")) {
    return { text: "Almost there — check your email and click the confirmation link before signing in." };
  }
  if (m.includes("email rate limit") || m.includes("rate limit")) {
    return { text: "Too many sign-in attempts. Wait a minute and try again." };
  }
  return {
    text: context === "sign-up"
      ? "Something went wrong creating your account. Try again, or use a magic link."
      : "Something went wrong signing in. Try again, or use a magic link.",
  };
}

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("sign-in");
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
  const handleError = (message: string) => {
    const f = friendlyError(message, mode);
    if (f.suggestSignIn && mode === "sign-up") {
      toast.error(f.text, {
        action: { label: "Sign in", onClick: () => setMode("sign-in") },
      });
    } else {
      toast.error(f.text);
    }
  };
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) return handleError(error.message);
        setSent(true);
        return;
      }
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${redirect}` },
        });
        if (error) return handleError(error.message);
        toast.success("Account created. Check your email to confirm.");
        return;
      }
      // sign-in
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return handleError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${redirect}`,
    });
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
  };
  const onForgotPassword = async () => {
    if (!email) return toast.error("Enter your email above first.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(`Password reset link sent to ${email}.`);
  };
  const header =
    mode === "sign-up" ? "Create your account" :
    mode === "magic" ? "Sign in with magic link" :
    "Welcome back";
  const subtitle =
    mode === "sign-up" ? "We'll send you a link to confirm your email." :
    mode === "magic" ? "We'll email you a link to sign in. No password needed." :
    null;
  const buttonLabel =
    mode === "sign-up" ? "Create account" :
    mode === "magic" ? "Send magic link" :
    "Sign in";
  return (
    <>
      <SEO title="Sign in" description="Sign in to manage your company profile and interviews." path="/auth" />
      <section className="container py-16 grid place-items-center">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-card">
          <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-hero text-primary-foreground mb-4"><Sparkles className="h-6 w-6" /></div>
          <h1 className="text-2xl font-bold">{header}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          {sent ? (
            <div className="mt-6 rounded-xl bg-secondary p-4 text-sm">
              <Mail className="inline h-4 w-4 mr-1 text-primary" />Check your email at <strong>{email}</strong> — we sent you a sign-in link.
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
              {mode !== "magic" && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Working…" : buttonLabel}
              </Button>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {mode === "sign-in" && (
                  <>
                    <button type="button" className="text-left underline-offset-2 hover:underline" onClick={onForgotPassword}>
                      Forgot your password? Email me a reset link
                    </button>
                    <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => setMode("sign-up")}>
                      New here? Create an account
                    </button>
                    <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => setMode("magic")}>
                      Use a magic link instead
                    </button>
                  </>
                )}
                {mode === "sign-up" && (
                  <>
                    <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => setMode("sign-in")}>
                      Already have an account? Sign in
                    </button>
                    <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => setMode("magic")}>
                      Use a magic link instead
                    </button>
                  </>
                )}
                {mode === "magic" && (
                  <>
                    <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => setMode("sign-in")}>
                      Use a password instead
                    </button>
                    <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => setMode("sign-up")}>
                      New here? Create an account
                    </button>
                  </>
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
