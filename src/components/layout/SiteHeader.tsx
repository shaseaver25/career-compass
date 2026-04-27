import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bookmark, Briefcase, Building2, Menu, Sparkles, User2 } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const links = [
  { to: "/careers", label: "Careers", icon: Briefcase },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/bookmarks", label: "Saved", icon: Bookmark },
];

export const SiteHeader = () => {
  const { user, isAdmin, isRep, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-hero text-primary-foreground shadow-elevated">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>CTE <span className="text-primary">Careers</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden md:flex items-center gap-2">
          {isAdmin && <Button variant="ghost" size="sm" asChild><Link to="/admin">Admin</Link></Button>}
          {isRep && <Button variant="ghost" size="sm" asChild><Link to="/dashboard">Dashboard</Link></Button>}
          {user ? (
            <Button variant="outline" size="sm" onClick={() => signOut().then(() => navigate("/"))}>Sign out</Button>
          ) : (
            <Button size="sm" asChild><Link to="/auth"><User2 className="mr-2 h-4 w-4" />For employers</Link></Button>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden ml-auto">
            <Button variant="ghost" size="icon" aria-label="Open menu"><Menu /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="mt-8 flex flex-col gap-1">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium hover:bg-muted">
                  {l.label}
                </NavLink>
              ))}
              {isAdmin && <NavLink to="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-muted">Admin</NavLink>}
              {isRep && <NavLink to="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-muted">Dashboard</NavLink>}
              <div className="mt-4 px-3">
                {user ? (
                  <Button className="w-full" variant="outline" onClick={() => { signOut(); setOpen(false); navigate("/"); }}>Sign out</Button>
                ) : (
                  <Button className="w-full" asChild><Link to="/auth" onClick={() => setOpen(false)}>For employers</Link></Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};