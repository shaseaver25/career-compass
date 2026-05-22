import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

export function MultiCheck({
  options, value, onChange, columns = 2, className,
}: {
  options: readonly Option[];
  value: string[];
  onChange: (v: string[]) => void;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const cols = columns === 1 ? "grid-cols-1" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  };
  return (
    <div className={cn("grid gap-2", cols, className)}>
      {options.map((opt) => {
        const id = `mc-${opt.value}`;
        const checked = value.includes(opt.value);
        return (
          <label
            key={opt.value}
            htmlFor={id}
            className={cn(
              "flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors",
              checked && "border-primary bg-primary/5"
            )}
          >
            <Checkbox id={id} checked={checked} onCheckedChange={() => toggle(opt.value)} />
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export function StringList({
  value, onChange, placeholder,
}: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const update = (i: number, s: string) => {
    const next = [...value];
    next[i] = s;
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={row}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="rounded-md border border-border px-3 text-xs text-muted-foreground hover:bg-accent"
            aria-label="Remove"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, ""])}
        className="text-xs text-primary hover:underline"
      >
        + Add another
      </button>
    </div>
  );
}