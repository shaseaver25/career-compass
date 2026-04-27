import { SEO } from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  return (
    <>
      <SEO title="Company dashboard" />
      <section className="container py-10">
        <h1 className="text-3xl md:text-4xl font-bold">Company dashboard</h1>
        <p className="text-muted-foreground mt-1">Signed in as {user?.email}</p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-bold">Company profile</h3>
            <p className="text-sm text-muted-foreground mt-1">Edit your company details and submit for admin review. Coming next.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-bold">Careers we hire for</h3>
            <p className="text-sm text-muted-foreground mt-1">Link to careers in our catalog or request new ones. Coming next.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-bold">Interviews</h3>
            <p className="text-sm text-muted-foreground mt-1">Upload audio interviews from your team and submit them for review.</p>
            <Button asChild className="mt-3" size="sm"><Link to="/dashboard/interviews/new">Record an interview</Link></Button>
          </div>
        </div>
        {isAdmin && <p className="mt-8 text-sm text-muted-foreground">You're an admin — head to <Link to="/admin" className="text-primary underline">/admin</Link> for the moderation queue.</p>}
      </section>
    </>
  );
};
export default Dashboard;
