import type { DirectoryItem } from "@/lib/site.functions";
import { Link } from "@tanstack/react-router";
import { MapPin, ExternalLink, ArrowRight } from "lucide-react";

export function AlumniCard({ item }: { item: DirectoryItem }) {
  const initials = item.full_name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
  return (
    <article className="archive-card group flex h-full flex-col p-7">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-[color:var(--gold)]/40 bg-[color:var(--parchment)] font-display text-sm font-black tracking-wider text-primary transition-colors group-hover:border-[color:var(--gold)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display truncate text-lg font-black leading-tight">{item.full_name}</h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--gold-deep)]">
            {item.role_title}{item.company ? ` @ ${item.company}` : ""}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-primary-soft">
            <MapPin className="h-3 w-3" />
            {item.city_name ?? "Remote"} · Class of {item.grad_year ?? "—"}
          </p>
          {item.department && (
            <p className="mt-1.5 text-[11px] font-medium text-primary-soft/90 line-clamp-1" title={item.department}>
              {item.department}
            </p>
          )}
        </div>
      </div>

      {item.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 3).map((t) => (
            <span key={t.slug} className="pill">{t.label}</span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <Link
          to="/alumni/$id"
          params={{ id: item.id }}
          className="btn-press inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[color:var(--parchment)] px-4 py-3 font-display text-sm font-black tracking-wide text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          View profile <ArrowRight className="h-4 w-4" />
        </Link>
        {item.linkedin_url && (
          <a
            href={item.linkedin_url}
            target="_blank"
            rel="noreferrer"
            className="btn-press inline-flex items-center gap-1 text-xs font-semibold text-primary-soft hover:text-[color:var(--gold-deep)]"
          >
            LinkedIn <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  );
}
