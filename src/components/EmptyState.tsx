import { ReactNode } from "react";
export const EmptyState = ({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) => (
  <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-10 text-center">
    {icon && <div className="mb-3 flex justify-center text-muted-foreground">{icon}</div>}
    <div className="font-semibold">{title}</div>
    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
