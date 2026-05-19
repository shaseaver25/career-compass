import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "company_rep" | "user";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: Role[];
  loading: boolean;
  isAdmin: boolean;
  isRep: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    // If the URL contains an auth callback (magic link hash / OAuth code),
    // Supabase is mid-flight parsing it. Don't let getSession()'s initial
    // null result flip loading=false before SIGNED_IN fires.
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const search = typeof window !== "undefined" ? window.location.search : "";
    const hasAuthCallback =
      hash.includes("access_token") ||
      hash.includes("error") ||
      /[?&]code=/.test(search);
    let resolved = false;
    const markResolved = () => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setRolesLoading(true);
        setTimeout(() => {
          supabase.from("user_roles").select("role").eq("user_id", s.user.id).then(({ data }) => {
            setRoles((data ?? []).map(r => r.role as Role));
            setRolesLoading(false);
          });
        }, 0);
      } else {
        setRoles([]);
        setRolesLoading(false);
      }
      markResolved();
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setRolesLoading(true);
        supabase.from("user_roles").select("role").eq("user_id", s.user.id).then(({ data }) => {
          setRoles((data ?? []).map(r => r.role as Role));
          setRolesLoading(false);
          markResolved();
        });
      } else if (!hasAuthCallback) {
        markResolved();
      }
      // If we have an auth callback in the URL and no session yet,
      // wait for onAuthStateChange to flip resolved.
    });
    // Safety net: never hang forever.
    const timeout = setTimeout(markResolved, 4000);
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <Ctx.Provider value={{
      user, session, roles, loading: loading || rolesLoading,
      isAdmin: roles.includes("admin"),
      isRep: roles.includes("company_rep") || roles.includes("admin"),
      signOut,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
};