import type { DirectoryItem } from "@/lib/site.functions";
import { Link } from "@tanstack/react-router";
import { MapPin, ExternalLink, Quote } from "lucide-react";

export function AlumniCard({ item }: { item: DirectoryItem }) {
  const initials = item.full_name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
  return (
    <article className="soft-card soft-card-hover flex h-full flex-col p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface text-sm font-semibold text-primary ring-1 ring-primary/15">
          {initials}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{item.full_name}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {item.role_title}
            {item.company ? ` · ${item.company}` : ""}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {item.city_name ?? "Remote"} · Class of {item.grad_year ?? "—"}
          </p>
          {item.department && (
            <p className="mt-1 text-xs font-medium text-primary/90">{item.department}</p>
          )}
        </div>
      </div>

      {item.message_to_juniors && (
        <blockquote className="mt-5 rounded-xl border border-border bg-surface/60 p-4">
          <Quote className="h-4 w-4 text-primary-soft" />
          <p className="mt-1.5 text-sm italic leading-relaxed text-foreground">
            “{item.message_to_juniors}”
          </p>
        </blockquote>
      )}

      {item.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.tags.map((t) => (
            <span key={t.slug} className="pill">{t.label}</span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <Link
          to="/alumni/$id"
          params={{ id: item.id }}
          className="btn-press inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          View profile
        </Link>
        {item.linkedin_url && (
          <a
            href={item.linkedin_url}
            target="_blank"
            rel="noreferrer"
            className="btn-press inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            LinkedIn <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  );
}
