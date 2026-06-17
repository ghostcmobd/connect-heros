import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getAlumnusById } from "@/lib/site.functions";
import { FadeIn } from "@/components/FadeIn";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ExternalLink, MapPin, Quote, ArrowLeft } from "lucide-react";

const alumnusQuery = (id: string) =>
  queryOptions({
    queryKey: ["alumnus", id],
    queryFn: async () => {
      const data = await getAlumnusById({ data: { id } });
      if (!data) throw notFound();
      return data;
    },
  });

export const Route = createFileRoute("/alumni/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(alumnusQuery(params.id)),
  head: ({ loaderData }) => {
    const p: any = loaderData;
    const name = p?.full_name ?? "Alumnus";
    const title = `${name} — THE KNOT`;
    const desc = p?.message_to_juniors ?? `${name} on THE KNOT`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: AlumnusPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md p-16 text-center">
      <p className="text-sm text-muted-foreground">Alumnus not found.</p>
      <Link to="/directory" className="mt-4 inline-block text-sm text-primary underline">Back to directory</Link>
    </div>
  ),
});

function AlumnusPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(alumnusQuery(id));
  const p: any = data;
  const initials = p.full_name.split(" ").map((s: string) => s[0]).slice(0, 2).join("");

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <Link to="/directory" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Directory
      </Link>

      <FadeIn>
        <div className="soft-card p-8 sm:p-10">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-surface text-2xl font-semibold text-primary ring-1 ring-primary/15">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {p.full_name}
                {p.is_verified && <VerifiedBadge size="md" />}
              </h1>
              <p className="mt-1 text-muted-foreground">{p.headline ?? `${p.role_title} at ${p.company}`}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.city_name ?? "—"}</span>
                <span>·</span>
                <span>Class of {p.grad_year ?? "—"}</span>
              </p>
              {p.department && (
                <p className="mt-1.5 text-sm font-medium text-primary">{p.department}</p>
              )}
            </div>
            {p.linkedin_url && (
              <a
                href={p.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="btn-press inline-flex items-center gap-1.5 rounded-full bg-[#0a66c2] px-4 py-2 text-sm font-medium text-white"
              >
                LinkedIn <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {p.message_to_juniors && (
            <blockquote className="mt-8 rounded-xl border border-border bg-surface/60 p-6">
              <Quote className="h-5 w-5 text-primary-soft" />
              <p className="mt-2 text-lg italic leading-relaxed">“{p.message_to_juniors}”</p>
            </blockquote>
          )}

          {p.tags?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Happy to help with</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.tags.map((t: any) => (
                  <span key={t.slug} className="pill">{t.label}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </FadeIn>

      {p.wisdom?.length > 0 && (
        <FadeIn delay={0.1}>
          <section className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight">More from {p.full_name.split(" ")[0]}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {p.wisdom.map((w: any) => (
                <div key={w.id} className="soft-card soft-card-hover p-5">
                  <Quote className="h-4 w-4 text-primary-soft" />
                  <p className="mt-2 text-sm leading-relaxed">{w.quote}</p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{w.category}</p>
                </div>
              ))}
            </div>
          </section>
        </FadeIn>
      )}
    </div>
  );
}
