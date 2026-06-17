import { useMemo, useState } from "react";
import type { WisdomItem } from "@/lib/site.functions";
import { Link } from "@tanstack/react-router";
import { Mail, Sparkles } from "lucide-react";

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
    // pick a different random letter
    let next = index;
    if (pool.length > 1) {
      while (next === index) next = Math.floor(Math.random() * pool.length);
    }
    setOpen(false);
    setTimeout(() => {
      setIndex(next);
      setAnimKey((k) => k + 1);
      setOpen(true);
    }, 220);
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
      {/* Mailbox */}
      <button
        type="button"
        onClick={handleTap}
        aria-label={open ? "Draw another letter" : "Open the mailbox"}
        className="group relative mx-auto block focus:outline-none"
      >
        <div className="relative h-[150px] w-[220px]">
          {/* post */}
          <div className="absolute bottom-0 left-1/2 h-[58px] w-3 -translate-x-1/2 rounded-sm bg-gradient-to-b from-[#6b4a2b] to-[#3e2a18]" />
          {/* box body */}
          <div className="absolute bottom-[52px] left-1/2 h-[92px] w-[200px] -translate-x-1/2 overflow-hidden rounded-t-[100px] rounded-b-[14px] bg-gradient-to-b from-[#c0392b] via-[#a8281b] to-[#7a1a10] shadow-[0_18px_36px_-12px_rgba(122,26,16,0.55),inset_0_2px_0_rgba(255,255,255,0.25)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-[1.02]">
            {/* slot */}
            <div className="absolute left-1/2 top-7 h-[10px] w-[120px] -translate-x-1/2 rounded-full bg-black/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            {/* peeking letter */}
            <div
              key={`peek-${animKey}`}
              className={`absolute left-1/2 top-[18px] h-5 w-[110px] -translate-x-1/2 rounded-sm bg-[#fdf6e3] shadow-md transition-all duration-500 ${
                open ? "-translate-y-3 opacity-100" : "translate-y-3 opacity-0"
              }`}
            />
            {/* "MAIL" label */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-[0.3em] text-white/80">
              ALUMNI
            </div>
          </div>
          {/* flag */}
          <div
            className={`absolute bottom-[110px] right-[2px] h-[26px] w-[34px] origin-bottom-left rounded-sm bg-gradient-to-br from-[#f1c40f] to-[#d49a05] shadow-md transition-transform duration-500 ${
              open ? "rotate-[-15deg]" : "rotate-[30deg]"
            }`}
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 100%)" }}
          />
          {/* sparkle hint */}
          {!open && (
            <Sparkles className="absolute -right-2 -top-1 h-5 w-5 animate-pulse text-amber-500" />
          )}
        </div>
        <div className="mt-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {open ? "Tap for another letter" : "Tap to open the mailbox"}
        </div>
      </button>

      {/* Letter */}
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
            {/* paper texture */}
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
              <Mail className="h-5 w-5 text-primary-soft" strokeWidth={2.25} />
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
