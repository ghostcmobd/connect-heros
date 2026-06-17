import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getMapPins } from "@/lib/site.functions";
import { AlumniMap } from "@/components/AlumniMap";
import { FadeIn } from "@/components/FadeIn";

const mapQuery = queryOptions({ queryKey: ["map", "pins"], queryFn: () => getMapPins() });

export const Route = createFileRoute("/map")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Alumni World Map — Almanac" },
      { name: "description", content: "An interactive world map of alumni — hover a city to see who's there." },
      { property: "og:title", content: "Alumni World Map — Almanac" },
      { property: "og:description", content: "Hover a city to see alumni working there." },
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
            <AlumniMap cities={data} />
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
