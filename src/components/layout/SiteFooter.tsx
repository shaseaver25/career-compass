import { Link } from "react-router-dom";

export const SiteFooter = () => (
  <footer className="border-t border-border/60 mt-20 bg-surface">
    <div className="container py-10 grid gap-6 md:grid-cols-4 text-sm">
      <div>
        <div className="font-bold text-lg mb-2">CTE <span className="text-primary">Careers</span></div>
        <p className="text-muted-foreground">Helping students see real careers and the local companies that hire for them.</p>
      </div>
      <div>
        <div className="font-semibold mb-2">Explore</div>
        <ul className="space-y-1 text-muted-foreground">
          <li><Link className="hover:text-foreground" to="/careers">Careers</Link></li>
          <li><Link className="hover:text-foreground" to="/companies">Companies</Link></li>
          <li><Link className="hover:text-foreground" to="/bookmarks">Saved</Link></li>
        </ul>
      </div>
      <div>
        <div className="font-semibold mb-2">For employers</div>
        <ul className="space-y-1 text-muted-foreground">
          <li><Link className="hover:text-foreground" to="/auth">Sign in</Link></li>
          <li><Link className="hover:text-foreground" to="/dashboard">Company dashboard</Link></li>
        </ul>
      </div>
      <div>
        <div className="font-semibold mb-2">About</div>
        <p className="text-muted-foreground">A statewide initiative to connect classrooms with careers.</p>
      </div>
    </div>
    <div className="border-t border-border/60">
      <div className="container py-4 text-xs text-muted-foreground">© {new Date().getFullYear()} CTE Careers</div>
    </div>
  </footer>
);