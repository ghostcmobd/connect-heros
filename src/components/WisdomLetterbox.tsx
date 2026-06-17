import { useMemo, useState } from "react";
import type { WisdomItem } from "@/lib/site.functions";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

const stampTints = [
  "from-[oklch(0.94_0.04_145)]",
  "from-[oklch(0.94_0.025_250)]",
  "from-[oklch(0.94_0.04_85)]",
  "from-[oklch(0.94_0.04_320)]",
  "from-[oklch(0.94_0.04_25)]",
];

export function WisdomLetterbox({ items }: { items: WisdomItem[] }) {
  const pool = useMemo(() => items.filter(Boolean), [items]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  if (pool.length === 0) {
    return (
      <div className="soft-card mx-auto max-w-xl p-10 text-center text-muted-foreground">
        No letters yet. Be the first to share a note.
      </div>
    );
  }

  const item = pool[index % pool.length];
  const initials = item.profile.full_name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
  const tint = stampTints[index % stampTints.length];

  function drawNext() {
    let next = index;
    if (pool.length > 1) {
      while (next === index) next = Math.floor(Math.random() * pool.length);
    }
    setOpen(false);
    setTimeout(() => {
      setIndex(next);
      setAnimKey((k) => k + 1);
      setOpen(true);
    }, 280);
  }

  function handleTap() {
    if (!open) {
      setOpen(true);
      setAnimKey((k) => k + 1);
    } else {
      drawNext();
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center">
      {/* Envelope */}
      <button
        type="button"
        onClick={handleTap}
        aria-label={open ? "Draw another letter" : "Open the envelope"}
        className="group relative block focus:outline-none"
        style={{ perspective: 1000 }}
      >
        <div className="relative h-[180px] w-[280px] transition-transform duration-300 group-hover:-translate-y-1">
          {/* envelope back / body */}
          <div className="absolute inset-0 rounded-md bg-gradient-to-br from-[#f3d9a8] via-[#e9c890] to-[#c9a36a] shadow-[0_20px_40px_-14px_rgba(80,50,20,0.45),inset_0_2px_0_rgba(255,255,255,0.4)]" />

          {/* letter sticking out */}
          <div
            key={`paper-${animKey}`}
            className={`absolute left-1/2 top-1/2 h-[140px] w-[240px] -translate-x-1/2 rounded-sm bg-[#fdf6e3] shadow-[0_6px_18px_rgba(0,0,0,0.18)] transition-all duration-500 ease-out ${
              open ? "-translate-y-[110%] opacity-100" : "-translate-y-1/2 opacity-100"
            }`}
            style={{ zIndex: 1 }}
          >
            <div className="flex h-full flex-col justify-center gap-2 px-5">
              <div className="h-1.5 w-3/4 rounded-full bg-foreground/10" />
              <div className="h-1.5 w-full rounded-full bg-foreground/10" />
              <div className="h-1.5 w-5/6 rounded-full bg-foreground/10" />
              <div className="h-1.5 w-2/3 rounded-full bg-foreground/10" />
            </div>
          </div>

          {/* envelope front pocket */}
          <div
            className="absolute inset-x-0 bottom-0 h-[105px] rounded-b-md bg-gradient-to-b from-[#e9c890] to-[#b8904f] shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]"
            style={{ zIndex: 2 }}
          />

          {/* flap (top triangle) */}
          <div
            className="absolute left-0 right-0 top-0 origin-top transition-transform duration-500 ease-out"
            style={{
              height: "110px",
              transform: open ? "rotateX(180deg)" : "rotateX(0deg)",
              transformStyle: "preserve-3d",
              zIndex: open ? 0 : 3,
            }}
          >
            <div
              className="h-full w-full bg-gradient-to-b from-[#f3d9a8] to-[#d8b073] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]"
              style={{
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                backfaceVisibility: "hidden",
              }}
            />
            {/* back of flap (shows when open) */}
            <div
              className="absolute inset-0 h-full w-full bg-gradient-to-t from-[#e9c890] to-[#c9a36a]"
              style={{
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                transform: "rotateX(180deg)",
                backfaceVisibility: "hidden",
              }}
            />
          </div>

          {/* wax seal */}
          {!open && (
            <div
              className="absolute left-1/2 top-[78px] grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full bg-gradient-to-br from-[#d14b4b] to-[#7a1a1a] text-[10px] font-black uppercase tracking-wider text-white/90 shadow-[0_4px_10px_rgba(122,26,26,0.5),inset_0_2px_4px_rgba(255,255,255,0.2)]"
              style={{ zIndex: 4 }}
            >
              ✦
            </div>
          )}

          {/* sparkle hint */}
          {!open && (
            <Sparkles className="absolute -right-3 -top-2 h-5 w-5 animate-pulse text-amber-500" />
          )}
        </div>
        <div className="mt-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {open ? "Tap for another letter" : "Tap to open the envelope"}
        </div>
      </button>

      {/* Letter content */}
      <div className="relative mt-8 w-full" style={{ perspective: 1200 }}>
        <div
          key={`letter-${animKey}`}
          className={`relative mx-auto w-full max-w-xl transition-all duration-500 ease-out ${
            open
              ? "translate-y-0 rotate-[-0.4deg] opacity-100"
              : "pointer-events-none -translate-y-6 opacity-0"
          }`}
        >
          <div className="soft-card relative overflow-hidden p-7 sm:p-9">
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tint} to-transparent opacity-60`} />
            {/* stamp */}
            <div className="pointer-events-none absolute right-5 top-5 hidden h-16 w-14 rotate-[6deg] border-2 border-dashed border-foreground/20 bg-background/60 p-1 text-center sm:block">
              <div className="grid h-full w-full place-items-center rounded-sm bg-primary/10 text-[9px] font-bold uppercase tracking-wider text-primary">
                Alumni<br />Post
              </div>
            </div>
            {/* postmark */}
            <div className="pointer-events-none absolute left-6 top-6 hidden h-16 w-16 -rotate-12 rounded-full border-2 border-foreground/15 sm:block">
              <div className="grid h-full w-full place-items-center text-[9px] font-semibold uppercase tracking-wider text-foreground/40">
                {item.category}
              </div>
            </div>

            <div className="relative pt-10 sm:px-12">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Dear student,
              </div>
              <p className="mt-4 font-serif text-[17px] leading-relaxed text-foreground sm:text-lg">
                "{item.quote}"
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-5">
                <div className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-xs font-semibold text-primary">
                  {initials}
                </div>
                <div className="leading-tight">
                  <Link
                    to="/alumni/$id"
                    params={{ id: item.profile.id }}
                    className="text-sm font-semibold hover:underline"
                  >
                    {item.profile.full_name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    Class of {item.profile.grad_year ?? "—"} · {item.profile.role_title}
                    {item.profile.company ? ` at ${item.profile.company}` : ""}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
