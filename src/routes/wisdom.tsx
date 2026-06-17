import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { getWisdomFeed, type WisdomItem } from "@/lib/site.functions";
import { WisdomCard } from "@/components/WisdomCard";
import { FadeIn } from "@/components/FadeIn";
import { ArrowRight, Sparkles } from "lucide-react";

const wisdomQuery = queryOptions({
  queryKey: ["wisdom", "all"],
  queryFn: () => getWisdomFeed({ data: {} }),
});

export const Route = createFileRoute("/wisdom")({
  head: () => ({
    meta: [
      { title: "Words of Wisdom — Almanac" },
      { name: "description", content: "Short, honest notes from alumni about career, academics, internships, and life." },
      { property: "og:title", content: "Words of Wisdom — Almanac" },
      { property: "og:description", content: "Short, honest notes from alumni for current students." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(wisdomQuery);
  },
  component: WisdomPage,
});

const categories: { value: WisdomItem["category"] | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "career", label: "Career" },
  { value: "academics", label: "Academics" },
  { value: "internships", label: "Internships" },
  { value: "life", label: "Life" },
];

function WisdomPage() {
  const { data } = useSuspenseQuery(wisdomQuery);
  const [cat, setCat] = useState<(typeof categories)[number]["value"]>("all");
  const filtered = useMemo(() => (cat === "all" ? data : data.filter((d) => d.category === cat)), [cat, data]);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/3 h-[520px] w-[520px] rounded-full bg-[oklch(0.93_0.05_145)] blur-3xl" />
        </div>
        <div className="mx-auto max-w-5xl px-5 py-16 text-center sm:py-20">
          <FadeIn>
            <span className="pill mb-5">
              <Sparkles className="h-3.5 w-3.5" /> Words of Wisdom Wall
            </span>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              The advice you wish someone told you in <span className="text-primary">first year.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
              Honest, short notes from alumni — written for the student you are right now.
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/directory" className="btn-press inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
                Meet the alumni <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">{filtered.length} notes from alumni</h2>
          <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setCat(c.value)}
                className={`btn-press rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  cat === c.value
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto pb-2 sm:hidden">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCat(c.value)}
              className={`btn-press shrink-0 rounded-full px-3.5 py-1.5 text-sm ${
                cat === c.value ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <motion.div layout className="masonry-3">
          {filtered.map((item, i) => (
            <FadeIn key={item.id} delay={Math.min(i * 0.02, 0.3)}>
              <WisdomCard item={item} />
            </FadeIn>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
