import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { getDirectory, getMapPins, getWisdomFeed } from "@/lib/site.functions";
import { ShufflingAlumni } from "@/components/ShufflingAlumni";
import { TopCompanies } from "@/components/TopCompanies";
import { WisdomLetterbox } from "@/components/WisdomLetterbox";
import { ArrowRight, Loader2 } from "lucide-react";

const AlumniMap = lazy(() => import("@/components/AlumniMap").then((m) => ({ default: m.AlumniMap })));

const mapQuery = queryOptions({ queryKey: ["map", "pins"], queryFn: () => getMapPins() });
const directoryQuery = queryOptions({ queryKey: ["directory", "all"], queryFn: () => getDirectory({ data: {} }) });
const wisdomQuery = queryOptions({ queryKey: ["wisdom", "all"], queryFn: () => getWisdomFeed({ data: {} }) });

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "THE KNOT — Where alumni lead" },
      { name: "description", content: "Find alumni around the world, see who's hiring, and read wisdom from those who walked the path." },
      { property: "og:title", content: "THE KNOT — Where alumni lead" },
      { property: "og:description", content: "An alumni registry connecting current students with the people who've already walked their path." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(mapQuery);
    context.queryClient.ensureQueryData(directoryQuery);
    context.queryClient.ensureQueryData(wisdomQuery);
  },
  component: Home,
});

function SectionHeader({ eyebrow, title, href }: { eyebrow: string; title: string; href?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mt-1 font-display text-xl font-black tracking-tight sm:text-2xl">{title}</h2>
      </div>
      {href && (
        <Link
          to={href as any}
          className="shrink-0 inline-flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-primary-soft hover:text-[color:var(--gold-deep)]"
        >
          See all <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function Home() {
  const { data: cities } = useSuspenseQuery(mapQuery);
  const { data: alumni } = useSuspenseQuery(directoryQuery);
  const { data: wisdom } = useSuspenseQuery(wisdomQuery);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-10 flex flex-col gap-7">

      {/* 1. Map */}
      <section>
        <SectionHeader eyebrow="Global map" title="Alumni near you" href="/directory" />
        <div className="archive-card relative h-[260px] overflow-hidden p-0 sm:h-[320px]">
          <Suspense fallback={<div className="grid h-full w-full place-items-center bg-primary"><Loader2 className="h-5 w-5 animate-spin text-[color:var(--parchment)]/70" /></div>}>
            <AlumniMap cities={cities} />
          </Suspense>
          <div className="pointer-events-none absolute right-3 top-3 z-[400] inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold)]/40 bg-primary/80 px-2.5 py-1 font-display text-[9px] font-bold uppercase tracking-[0.18em] text-[color:var(--parchment)] backdrop-blur-md">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-[color:var(--gold)] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--gold)]" />
            </span>
            Live
          </div>
        </div>
      </section>

      {/* 2. Shuffling alumni */}
      <section>
        <SectionHeader eyebrow="Open to chat" title="Meet alumni" href="/directory" />
        <ShufflingAlumni alumni={alumni} count={4} intervalMs={4000} />
      </section>

      {/* 3. Top companies */}
      <section>
        <SectionHeader eyebrow="Where they work" title="Top companies" href="/companies" />
        <TopCompanies alumni={alumni} limit={6} />
      </section>

      {/* 4. Wisdom board */}
      <section>
        <SectionHeader eyebrow="Wisdom board" title="Words of wisdom" href="/wisdom" />
        <WisdomLetterbox items={wisdom} />
      </section>
    </div>
  );
}
