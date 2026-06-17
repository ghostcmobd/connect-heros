import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { lazy, Suspense, useMemo } from "react";
import { getDirectory, getMapPins, getWisdomFeed } from "@/lib/site.functions";
import { ShufflingAlumni } from "@/components/ShufflingAlumni";
import { WisdomLetterbox } from "@/components/WisdomLetterbox";
import { FadeIn } from "@/components/FadeIn";
import { ArrowRight, Heart, Linkedin, Loader2, MapPin, Users, MessageCircle } from "lucide-react";

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
  const wisdomTeaser = useMemo(() => wisdom.slice(0, 6), [wisdom]);

  return (
    <div>
      {/* Hero with map */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-[oklch(0.93_0.05_145)] blur-3xl" />
          <div className="absolute top-10 right-10 h-[380px] w-[380px] rounded-full bg-[oklch(0.94_0.04_85)] blur-3xl opacity-60" />
        </div>
        <div className="mx-auto max-w-7xl px-5 pt-12 pb-8 sm:pt-16">
          <FadeIn>
            <span className="pill mb-4">
              <Users className="h-3.5 w-3.5" /> {totalAlumni}+ alumni across {cities.length} cities
            </span>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              See where alumni are — and <span className="text-primary">reach the right one.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Almanac plots every alumnus on the map and surfaces the ones open to help current students. Browse the directory, filter by your department, or swipe through matches.
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/directory" className="btn-press inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
                Browse alumni <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/match" className="btn-press inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-medium hover:bg-surface">
                <Heart className="h-4 w-4 text-primary" /> Swipe to match
              </Link>
              <Link to="/auth" className="btn-press inline-flex items-center gap-2 rounded-full bg-[#0a66c2] px-5 py-3 text-sm font-medium text-white shadow-sm hover:opacity-95">
                <Linkedin className="h-4 w-4" /> Sync with LinkedIn
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="soft-card mt-10 overflow-hidden p-1.5">
              <div className="h-[420px] overflow-hidden rounded-2xl sm:h-[520px]">
                <Suspense fallback={<div className="grid h-full place-items-center bg-surface/40"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}>
                  <AlumniMap cities={cities} />
                </Suspense>
              </div>
            </div>
          </FadeIn>
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

      {/* How it works */}
      <section className="border-y border-border/60 bg-surface/40">
        <div className="mx-auto max-w-7xl px-5 py-16">
          <FadeIn>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
          </FadeIn>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { icon: MapPin, title: "Find alumni near (or far)", body: "Explore the map or directory by city, company, and how they want to help." },
              { icon: MessageCircle, title: "Reach out, no cold-DM dread", body: "Every alumnus writes what they're open to — resume reviews, mock interviews, coffee chats." },
              { icon: Linkedin, title: "Alumni: one-click join", body: "Sync your LinkedIn and you're listed in under a minute. No long forms." },
            ].map((s, i) => (
              <FadeIn key={s.title} delay={i * 0.05}>
                <div className="soft-card h-full p-6">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
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
