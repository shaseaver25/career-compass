import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookmarks } from "@/hooks/useBookmarks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const BookmarkButton = ({ kind, slug, label, className }: { kind: "career" | "company"; slug: string; label?: string; className?: string }) => {
  const { has, toggle } = useBookmarks(kind);
  const saved = has(slug);
  return (
    <Button variant={saved ? "secondary" : "outline"} size="sm" className={cn("gap-2", className)}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(slug); toast.success(saved ? "Removed from saved" : "Saved", { description: label }); }}
      aria-pressed={saved}>
      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
    </Button>
  );
};
