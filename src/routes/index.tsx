import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { getDirectory, getMapPins, getWisdomFeed } from "@/lib/site.functions";
import { ShufflingAlumni } from "@/components/ShufflingAlumni";
import { WisdomLetterbox } from "@/components/WisdomLetterbox";
import { FadeIn } from "@/components/FadeIn";
import { ArrowRight, Heart, Linkedin, Loader2, Users } from "lucide-react";

const AlumniMap = lazy(() => import("@/components/AlumniMap").then((m) => ({ default: m.AlumniMap })));

const mapQuery = queryOptions({ queryKey: ["map", "pins"], queryFn: () => getMapPins() });
const directoryQuery = queryOptions({ queryKey: ["directory", "all"], queryFn: () => getDirectory({ data: {} }) });
const wisdomQuery = queryOptions({ queryKey: ["wisdom", "all"], queryFn: () => getWisdomFeed({ data: {} }) });

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Almanac — Connect with alumni from your university" },
      { name: "description", content: "Find alumni around the world, see what they're working on, and reach out for resume reviews, mock interviews, and coffee chats." },
      { property: "og:title", content: "Almanac — Connect with alumni from your university" },
      { property: "og:description", content: "Find alumni, see where they are, and reach out for real help." },
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

  return (
    <div>
      {/* Full-screen map hero */}
      <section className="relative h-[calc(100vh-4rem)] min-h-[520px] w-full overflow-hidden">
        <Suspense fallback={<div className="grid h-full place-items-center bg-surface/40"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}>
          <AlumniMap cities={cities} />
        </Suspense>

        {/* Floating overlay panel */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] px-4 pt-6 sm:px-8 sm:pt-10">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <div className="pointer-events-auto inline-flex flex-col items-start gap-3 rounded-3xl border border-border/60 bg-background/85 p-5 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.25)] backdrop-blur-md sm:p-6">
                <span className="pill">
                  <Users className="h-3.5 w-3.5" /> {totalAlumni}+ alumni across {cities.length} cities
                </span>
                <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  See where alumni are — <span className="text-primary">reach the right one.</span>
                </h1>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Link to="/directory" className="btn-press inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
                    Browse alumni <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/match" className="btn-press inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-surface">
                    <Heart className="h-4 w-4 text-primary" /> Swipe to match
                  </Link>
                  <Link to="/auth" className="btn-press inline-flex items-center gap-2 rounded-full bg-[#0a66c2] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95">
                    <Linkedin className="h-4 w-4" /> Sync LinkedIn
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Shuffling featured alumni */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <FadeIn>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Alumni open to chat</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                A fresh set every few seconds — real graduates, real companies, real ways they want to help.
              </p>
            </div>
            <Link to="/directory" className="btn-press inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-surface">
              See all {alumni.length} alumni <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FadeIn>
        <ShufflingAlumni alumni={alumni} count={3} intervalMs={5000} />
      </section>

      {/* Words of wisdom teaser */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <FadeIn>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Words of wisdom</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">Short notes from alumni — the things they wish someone had told them.</p>
            </div>
            <Link to="/wisdom" className="btn-press inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-surface">
              Read the wall <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FadeIn>
        <FadeIn>
          <WisdomLetterbox items={wisdom} />
        </FadeIn>
      </section>
    </div>
  );
}
