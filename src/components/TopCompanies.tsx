import type { DirectoryItem } from "@/lib/site.functions";
import { useMemo } from "react";
import { Building2 } from "lucide-react";

export function TopCompanies({ alumni, limit = 6 }: { alumni: DirectoryItem[]; limit?: number }) {
  const top = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of alumni) {
      if (!a.company) continue;
      counts.set(a.company, (counts.get(a.company) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }, [alumni, limit]);

  if (top.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {top.map((c) => (
        <div
          key={c.name}
          className="archive-card flex items-center gap-3 p-3"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-sm font-black leading-tight">{c.name}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--gold-deep)]">
              {c.count} alum{c.count === 1 ? "" : "ni"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
