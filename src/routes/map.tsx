import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { getMapPins } from "@/lib/site.functions";
import { FadeIn } from "@/components/FadeIn";
import { Loader2 } from "lucide-react";

const AlumniMap = lazy(() => import("@/components/AlumniMap").then((m) => ({ default: m.AlumniMap })));

const mapQuery = queryOptions({ queryKey: ["map", "pins"], queryFn: () => getMapPins() });

export const Route = createFileRoute("/map")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Alumni World Map — Almanac" },
      { name: "description", content: "An interactive world map of alumni — click a city to see who's there." },
      { property: "og:title", content: "Alumni World Map — Almanac" },
      { property: "og:description", content: "Click a city to see alumni working there." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(mapQuery);
  },
  component: MapPage,
});

function MapPage() {
  const { data } = useSuspenseQuery(mapQuery);
  const total = data.reduce((s, c) => s + c.count, 0);
  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <FadeIn>
        <header className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Where alumni are, right now</h1>
          <p className="mt-3 text-muted-foreground">
            {total} alumni across {data.length} cities. Click a city pin to see who's there.
          </p>
        </header>
      </FadeIn>
      <FadeIn delay={0.05}>
        <div className="soft-card overflow-hidden p-1.5">
          <div className="h-[70vh] overflow-hidden rounded-xl">
            <Suspense fallback={<div className="grid h-full place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}>
              <AlumniMap cities={data} />
            </Suspense>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
