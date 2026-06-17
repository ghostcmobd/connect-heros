import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { getDirectory, getHelpTags } from "@/lib/site.functions";
import { DEPARTMENTS } from "@/lib/departments";
import { AlumniCard } from "@/components/AlumniCard";
import { FadeIn } from "@/components/FadeIn";
import { Search } from "lucide-react";

const directoryQuery = queryOptions({
  queryKey: ["directory", "all"],
  queryFn: () => getDirectory({ data: {} }),
});
const tagsQuery = queryOptions({ queryKey: ["help_tags"], queryFn: () => getHelpTags() });

export const Route = createFileRoute("/directory")({
  head: () => ({
    meta: [
      { title: "Alumni Directory — Almanac" },
      { name: "description", content: "Search alumni by name, department, company, city, and how they want to help current students." },
      { property: "og:title", content: "Alumni Directory — Almanac" },
      { property: "og:description", content: "Find alumni from your department who are open to help." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(directoryQuery);
    context.queryClient.ensureQueryData(tagsQuery);
  },
  component: Directory,
});

function Directory() {
  const { data: all } = useSuspenseQuery(directoryQuery);
  const { data: tags } = useSuspenseQuery(tagsQuery);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [department, setDepartment] = useState<string>("");

  const filtered = useMemo(() => {
    return all.filter((p) => {
      if (q) {
        const hay = `${p.full_name} ${p.company ?? ""} ${p.role_title ?? ""} ${p.headline ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (tag && !p.tags.some((t) => t.slug === tag)) return false;
      if (city && !(p.city_name ?? "").toLowerCase().includes(city.toLowerCase())) return false;
      if (department && p.department !== department) return false;
      return true;
    });
  }, [all, q, tag, city, department]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <FadeIn>
        <header className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Alumni directory</h1>
          <p className="mt-3 text-muted-foreground">
            A growing circle of alumni around the world. Filter by what they want to help with — every card carries a real message to current students.
          </p>

        </header>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="soft-card sticky top-20 z-20 mb-8 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, company, or role"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none sm:w-56"
          >
            <option value="">All departments</option>
            {Object.entries(DEPARTMENTS).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground sm:w-40"
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="-mx-1 mb-8 flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setTag(null)}
            className={`btn-press shrink-0 rounded-full px-3.5 py-1.5 text-sm ${
              tag === null ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground"
            }`}
          >
            All ways to help
          </button>
          {tags.map((t) => (
            <button
              key={t.slug}
              onClick={() => setTag(t.slug)}
              className={`btn-press shrink-0 rounded-full px-3.5 py-1.5 text-sm ${
                tag === t.slug ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </FadeIn>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface/60 p-12 text-center">
          <p className="text-sm text-muted-foreground">No alumni match those filters yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, i) => (
            <FadeIn key={item.id} delay={Math.min(i * 0.02, 0.25)}>
              <AlumniCard item={item} />
            </FadeIn>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-2xl border border-dashed border-border bg-surface/40 p-6 text-center text-sm text-muted-foreground">
        Are you an alumnus? <Link to="/auth" className="font-medium text-primary underline-offset-4 hover:underline">Sync with LinkedIn</Link> to add yourself in under a minute.
      </div>
    </div>
  );
}
