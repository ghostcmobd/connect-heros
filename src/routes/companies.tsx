import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getDirectory } from "@/lib/site.functions";
import { ArrowLeft, Building2, Search } from "lucide-react";

const directoryQuery = queryOptions({ queryKey: ["directory", "all"], queryFn: () => getDirectory({ data: {} }) });

export const Route = createFileRoute("/companies")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Top companies — THE KNOT" },
      { name: "description", content: "Companies ranked by the number of alumni employed there." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(directoryQuery);
  },
  component: CompaniesPage,
});

function CompaniesPage() {
  const { data: alumni } = useSuspenseQuery(directoryQuery);
  const [q, setQ] = useState("");

  const companies = useMemo(() => {
    const map = new Map<string, { name: string; count: number; people: typeof alumni }>();
    for (const a of alumni) {
      if (!a.company) continue;
      const key = a.company;
      if (!map.has(key)) map.set(key, { name: key, count: 0, people: [] });
      const e = map.get(key)!;
      e.count += 1;
      e.people.push(a);
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [alumni]);

  const filtered = useMemo(
    () => (q.trim() ? companies.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())) : companies),
    [companies, q]
  );

  const totalPlaced = companies.reduce((s, c) => s + c.count, 0);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-10 flex flex-col gap-5">
      <Link to="/" className="inline-flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-primary-soft hover:text-[color:var(--gold-deep)]">
        <ArrowLeft className="h-3.5 w-3.5" /> Home
      </Link>

      <header>
        <span className="eyebrow">Where they work</span>
        <h1 className="mt-1 font-display text-2xl font-black tracking-tight sm:text-3xl">Top companies</h1>
        <p className="mt-1 text-sm text-primary-soft">
          {companies.length} companies · {totalPlaced} alumni placed
        </p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-soft" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search companies"
          className="w-full rounded-2xl border border-[color:var(--gold)]/30 bg-card pl-9 pr-4 py-3 font-display text-sm font-semibold placeholder:text-primary-soft/60 focus:border-[color:var(--gold)] focus:outline-none"
        />
      </div>

      <ol className="flex flex-col gap-2">
        {filtered.map((c, i) => {
          const rank = companies.indexOf(c) + 1;
          return (
            <li key={c.name} className="archive-card flex items-center gap-3 p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--parchment)] border border-[color:var(--gold)]/40 font-display text-xs font-black text-primary">
                {rank}
              </div>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-sm font-black leading-tight">{c.name}</p>
                <p className="truncate text-[11px] text-primary-soft">
                  {c.people.slice(0, 2).map((p) => p.full_name).join(", ")}
                  {c.people.length > 2 ? ` +${c.people.length - 2} more` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-display text-lg font-black leading-none text-primary">{c.count}</div>
                <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[color:var(--gold-deep)]">
                  alum{c.count === 1 ? "" : "ni"}
                </div>
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="archive-card p-6 text-center text-sm text-primary-soft">No companies match "{q}".</li>
        )}
      </ol>
    </div>
  );
}
