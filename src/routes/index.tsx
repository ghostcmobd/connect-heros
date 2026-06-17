import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { getDirectory, getMapPins, getWisdomFeed } from "@/lib/site.functions";
import { ShufflingAlumni } from "@/components/ShufflingAlumni";
import { WisdomLetterbox } from "@/components/WisdomLetterbox";
import { FadeIn } from "@/components/FadeIn";
import { ArrowRight, Heart, Linkedin, Loader2 } from "lucide-react";

const AlumniMap = lazy(() => import("@/components/AlumniMap").then((m) => ({ default: m.AlumniMap })));

const mapQuery = queryOptions({ queryKey: ["map", "pins"], queryFn: () => getMapPins() });
const directoryQuery = queryOptions({ queryKey: ["directory", "all"], queryFn: () => getDirectory({ data: {} }) });
const wisdomQuery = queryOptions({ queryKey: ["wisdom", "all"], queryFn: () => getWisdomFeed({ data: {} }) });

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Almanac — Where alumni lead" },
      { name: "description", content: "Find alumni around the world, see what they're working on, and reach out for resume reviews, mock interviews, and coffee chats." },
      { property: "og:title", content: "Almanac — Where alumni lead" },
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

function Home() {
  const { data: cities } = useSuspenseQuery(mapQuery);
  const { data: alumni } = useSuspenseQuery(directoryQuery);
  const { data: wisdom } = useSuspenseQuery(wisdomQuery);

  const totalAlumni = cities.reduce((s, c) => s + c.count, 0);
  const activeCount = Math.min(alumni.length, 14);

  return (
    <div className="px-5 pt-8 pb-4 sm:px-8 sm:pt-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-24">

        {/* Hero — split rounded card */}
        <FadeIn>
          <section className="archive-card flex h-auto flex-col overflow-hidden p-0 shadow-[0_40px_80px_-40px_oklch(0.32_0.06_162/0.45)] lg:h-[680px] lg:flex-row">
            {/* Map */}
            <div className="relative flex h-[420px] w-full items-center justify-center overflow-hidden bg-primary lg:h-full lg:w-1/2">
              <Suspense fallback={<div className="grid h-full w-full place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[color:var(--parchment)]/70" /></div>}>
                <AlumniMap cities={cities} />
              </Suspense>
              {/* Decorative top-right chip */}
              <div className="pointer-events-none absolute right-5 top-5 z-[400] inline-flex items-center gap-2 rounded-full border border-[color:var(--gold)]/40 bg-primary/70 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--parchment)] backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[color:var(--gold)] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--gold)]" />
                </span>
                Live Global Network
              </div>
              {/* Bottom-left small caps */}
              <div className="pointer-events-none absolute bottom-5 left-5 z-[400] font-display text-[10px] font-bold uppercase tracking-[0.4em] text-[color:var(--parchment)]/55">
                Global Wisdom Network
              </div>
            </div>

            {/* Content */}
            <div className="relative flex w-full flex-col justify-center bg-card p-8 sm:p-12 lg:w-1/2 lg:p-16 xl:p-20">
              <span className="eyebrow">Est. Alumni Registry</span>

              <h1 className="mt-5 font-display text-5xl font-black leading-[0.88] tracking-tighter sm:text-6xl xl:text-7xl">
                Where<br />
                <span className="text-[color:var(--gold-deep)]">Alumni</span><br />
                Lead.
              </h1>

              <div className="mt-8 flex items-center gap-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-[color:var(--gold)] bg-[color:var(--parchment)] font-display text-[11px] font-black tracking-tight text-primary">
                  +{totalAlumni}
                </div>
                <p className="text-sm leading-snug text-primary-soft">
                  <span className="block font-display text-base font-black text-primary">
                    {totalAlumni.toLocaleString()} alumni
                  </span>
                  across {cities.length} cities ready to mentor.
                </p>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  to="/directory"
                  className="btn-press inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 font-display text-sm font-black uppercase tracking-[0.16em] text-primary-foreground shadow-[0_18px_30px_-14px_oklch(0.32_0.06_162/0.55)] hover:bg-[color:var(--primary-soft)]"
                >
                  Browse directory <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/match"
                  className="btn-press inline-flex items-center gap-2 rounded-full border-2 border-primary/15 px-7 py-4 font-display text-sm font-black uppercase tracking-[0.16em] text-primary transition-colors hover:border-[color:var(--gold)]"
                >
                  <Heart className="h-4 w-4 text-[color:var(--gold-deep)]" /> Swipe to match
                </Link>
              </div>

              <Link
                to="/auth"
                className="group mt-8 inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--primary-soft)] hover:text-[color:var(--gold-deep)]"
              >
                <Linkedin className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                Sync with LinkedIn
              </Link>
            </div>
          </section>
        </FadeIn>

        {/* Section: Alumni open to chat */}
        <section>
          <FadeIn>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="eyebrow">Nº 01</span>
                <h2 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-5xl">Live Mentorship</h2>
                <p className="mt-2 max-w-xl text-primary-soft">
                  Alumni currently online and open for a fifteen-minute conversation. A new set every five seconds.
                </p>
              </div>
              <div className="flex items-center gap-5">
                <div className="inline-flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-[color:var(--gold)] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--gold-deep)]" />
                  </span>
                  {activeCount} Active now
                </div>
                <Link
                  to="/directory"
                  className="btn-press inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold)]/40 bg-card px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] hover:border-[color:var(--gold)]"
                >
                  Full registry <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </FadeIn>
          <ShufflingAlumni alumni={alumni} count={3} intervalMs={5000} />
        </section>

        {/* Section: Words of wisdom */}
        <section className="pb-8">
          <FadeIn>
            <div className="mb-12 text-center">
              <span className="eyebrow justify-center">Nº 02 · Archived Wisdom</span>
              <h2 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-5xl">Words of Wisdom</h2>
              <p className="mx-auto mt-3 max-w-xl text-primary-soft">
                Sealed letters from alumni — the things they wish someone had told them.
              </p>
            </div>
          </FadeIn>
          <FadeIn>
            <WisdomLetterbox items={wisdom} />
          </FadeIn>
        </section>
      </div>
    </div>
  );
}
