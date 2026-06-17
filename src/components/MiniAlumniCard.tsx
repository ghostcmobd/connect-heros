import type { DirectoryItem } from "@/lib/site.functions";
import { Link } from "@tanstack/react-router";

export function MiniAlumniCard({ item }: { item: DirectoryItem }) {
  const initials = item.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("");
  return (
    <Link
      to="/alumni/$id"
      params={{ id: item.id }}
      className="archive-card group flex items-center gap-3 p-3 active:scale-[0.98] transition-transform"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[color:var(--gold)]/40 bg-[color:var(--parchment)] font-display text-xs font-black text-primary">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display truncate text-sm font-black leading-tight">{item.full_name}</p>
        <p className="truncate text-[11px] text-primary-soft">
          {item.role_title ?? "Alumnus"}{item.company ? ` · ${item.company}` : ""}
        </p>
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--gold-deep)] mt-0.5">
          {item.city_name ?? "Remote"}
        </p>
      </div>
    </Link>
  );
}
