import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { getDirectory } from "@/lib/site.functions";
import type { DirectoryItem } from "@/lib/site.functions";
import { FadeIn } from "@/components/FadeIn";
import { Heart, X, MapPin, RotateCw, Quote, Linkedin } from "lucide-react";
import { Link as RLink } from "@tanstack/react-router";

const directoryQuery = queryOptions({
  queryKey: ["directory", "all"],
  queryFn: () => getDirectory({ data: {} }),
});

export const Route = createFileRoute("/match")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Match — Find an alumnus to chat with · Almanac" },
      { name: "description", content: "Swipe through alumni who are open to help. Like the ones you want to message, pass on the rest." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(directoryQuery);
  },
  component: MatchPage,
});

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MatchPage() {
  const { data: all } = useSuspenseQuery(directoryQuery);
  const [deck, setDeck] = useState<DirectoryItem[]>(() => shuffle(all.filter((a) => a.tags.length > 0)));
  const [liked, setLiked] = useState<DirectoryItem[]>([]);
  const [passed, setPassed] = useState<DirectoryItem[]>([]);

  const top = deck[deck.length - 1];
  const next = deck[deck.length - 2];

  const advance = (dir: 1 | -1) => {
    if (!top) return;
    if (dir === 1) setLiked((l) => [...l, top]);
    else setPassed((p) => [...p, top]);
    setDeck((d) => d.slice(0, -1));
  };

  const reset = () => {
    setDeck(shuffle(all.filter((a) => a.tags.length > 0)));
    setLiked([]);
    setPassed([]);
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <FadeIn>
        <header className="mb-6 max-w-2xl">
          <span className="pill mb-3"><Heart className="h-3.5 w-3.5" /> Matching</span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Swipe to find your mentor</h1>
          <p className="mt-3 text-muted-foreground">
            Each card is an alumnus open to help. Swipe right (or tap the heart) on the ones you'd like to message — pass on the rest.
          </p>
        </header>
      </FadeIn>

      <div className="grid gap-10 md:grid-cols-[1fr_280px]">
        <div className="relative mx-auto h-[520px] w-full max-w-[380px]">
          {deck.length === 0 ? (
            <EmptyDeck likedCount={liked.length} onReset={reset} />
          ) : (
            <>
              {next && <DeckCard key={`bg-${next.id}`} item={next} isBackground />}
              <SwipeCard
                key={top.id}
                item={top}
                onSwipe={advance}
              />
            </>
          )}

          {deck.length > 0 && (
            <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-center gap-4">
              <button
                onClick={() => advance(-1)}
                className="btn-press grid h-14 w-14 place-items-center rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-surface"
                aria-label="Pass"
              >
                <X className="h-6 w-6" />
              </button>
              <button
                onClick={() => advance(1)}
                className="btn-press grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90"
                aria-label="Like"
              >
                <Heart className="h-7 w-7" />
              </button>
            </div>
          )}
        </div>

        <aside className="md:mt-0 mt-24">
          <div className="soft-card p-5">
            <h2 className="text-sm font-semibold tracking-tight">Your matches</h2>
            <p className="mt-1 text-xs text-muted-foreground">{liked.length} liked · {passed.length} passed · {deck.length} left</p>
            <div className="mt-4 space-y-2">
              {liked.length === 0 && <p className="text-sm text-muted-foreground">Swipe right on an alumnus to add them here.</p>}
              {liked.slice().reverse().map((p) => (
                <RLink
                  key={p.id}
                  to="/alumni/$id"
                  params={{ id: p.id }}
                  className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 hover:bg-surface"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.role_title}{p.company ? ` · ${p.company}` : ""}</p>
                  </div>
                  <Heart className="h-4 w-4 text-primary" fill="currentColor" />
                </RLink>
              ))}
            </div>
            <button
              onClick={reset}
              className="btn-press mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface"
            >
              <RotateCw className="h-3.5 w-3.5" /> Reshuffle deck
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DeckCard({ item, isBackground }: { item: DirectoryItem; isBackground?: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0.94, y: 12, opacity: 0.6 }}
      animate={{ scale: isBackground ? 0.94 : 1, y: isBackground ? 12 : 0, opacity: 1 }}
      className="absolute inset-0"
    >
      <CardBody item={item} />
    </motion.div>
  );
}

function SwipeCard({ item, onSwipe }: { item: DirectoryItem; onSwipe: (dir: 1 | -1) => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-140, -40], [1, 0]);

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) onSwipe(1);
        else if (info.offset.x < -120) onSwipe(-1);
      }}
      whileTap={{ scale: 0.98 }}
    >
      <CardBody item={item} />
      <motion.div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-5 top-5 rounded-md border-2 border-primary bg-background/80 px-3 py-1 text-sm font-bold uppercase tracking-wider text-primary backdrop-blur"
      >
        Connect
      </motion.div>
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="pointer-events-none absolute right-5 top-5 rounded-md border-2 border-destructive bg-background/80 px-3 py-1 text-sm font-bold uppercase tracking-wider text-destructive backdrop-blur"
      >
        Pass
      </motion.div>
    </motion.div>
  );
}

function CardBody({ item }: { item: DirectoryItem }) {
  const initials = item.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("");
  return (
    <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)]">
      <div className="flex items-start gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-surface text-lg font-semibold text-primary ring-1 ring-primary/20">
          {initials}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-tight">{item.full_name}</h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{item.role_title}{item.company ? ` · ${item.company}` : ""}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {item.city_name ?? "Remote"} · Class of {item.grad_year ?? "—"}
          </p>
        </div>
      </div>

      {item.department && (
        <p className="mt-3 text-xs font-medium text-primary">{item.department}</p>
      )}

      {item.message_to_juniors && (
        <blockquote className="mt-4 rounded-xl border border-border bg-surface/50 p-4">
          <Quote className="h-4 w-4 text-primary-soft" />
          <p className="mt-1.5 line-clamp-5 text-sm italic leading-relaxed">"{item.message_to_juniors}"</p>
        </blockquote>
      )}

      {item.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.tags.map((t) => (
            <span key={t.slug} className="pill">{t.label}</span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
        <span>Drag the card · or use buttons below</span>
        {item.linkedin_url && (
          <a href={item.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
            <Linkedin className="h-3.5 w-3.5" /> LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}

function EmptyDeck({ likedCount, onReset }: { likedCount: number; onReset: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface/50 p-8 text-center">
      <Heart className="h-10 w-10 text-primary" />
      <h3 className="mt-4 text-lg font-semibold">You're all done</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        You liked {likedCount} alumni. Open their profile to send a message, or reshuffle the deck to see them again.
      </p>
      <div className="mt-5 flex gap-2">
        <button onClick={onReset} className="btn-press rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Reshuffle
        </button>
        <Link to="/directory" className="btn-press rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-surface">
          Browse directory
        </Link>
      </div>
    </div>
  );
}
