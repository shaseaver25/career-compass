import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export const RequireRole = ({ role, children }: { role: "admin" | "company_rep"; children: ReactNode }) => {
  const { user, loading, isAdmin, isRep } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  if (!user) return <Navigate to={`/auth?redirect=${encodeURIComponent(loc.pathname)}`} replace />;
  const ok = role === "admin" ? isAdmin : isRep;
  if (!ok) return (
    <div className="container py-24 text-center">
      <h1 className="text-2xl font-bold mb-2">Access pending</h1>
      <p className="text-muted-foreground">Your account doesn't have access to this area yet. Contact an admin to get set up.</p>
    </div>
  );
  return <>{children}</>;
};
