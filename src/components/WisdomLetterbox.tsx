import { useMemo, useState } from "react";
import type { WisdomItem } from "@/lib/site.functions";
import { Link } from "@tanstack/react-router";

export function WisdomLetterbox({ items }: { items: WisdomItem[] }) {
  const pool = useMemo(() => items.filter(Boolean), [items]);
  const [index, setIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  if (pool.length === 0) {
    return (
      <div className="archive-card mx-auto max-w-2xl p-10 text-center text-primary-soft">
        No letters yet. Be the first to share a note.
      </div>
    );
  }

  const item = pool[index % pool.length];
  const correspondenceNo = String(842 + (index % pool.length)).padStart(3, "0");

  function drawNext() {
    let next = index;
    if (pool.length > 1) {
      while (next === index) next = Math.floor(Math.random() * pool.length);
    }
    setIndex(next);
    setAnimKey((k) => k + 1);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center">
      <div className="relative w-full">
        {/* Outer emerald frame with gold hairline padding */}
        <div className="relative rounded-[2.5rem] bg-primary p-[3px] shadow-[0_30px_80px_-30px_oklch(0.32_0.06_162/0.55)]">
          <div className="rounded-[calc(2.5rem-3px)] bg-[color:var(--gold)]/40 p-[1px]">
            <div className="overflow-hidden rounded-[calc(2.5rem-4px)] bg-primary">
              {/* Wax seal — tap target */}
              <button
                type="button"
                onClick={drawNext}
                aria-label="Reveal another letter"
                className="group absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
              >
                <div className="relative grid h-20 w-20 place-items-center rounded-full border-4 border-primary bg-gradient-to-br from-[color:var(--gold)] to-[color:var(--gold-deep)] shadow-[0_10px_24px_-8px_oklch(0.32_0.06_162/0.6),inset_0_2px_4px_rgba(255,255,255,0.35)] transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                  <span className="font-display text-3xl font-black text-primary">A</span>
                  {/* wax drip */}
                  <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-[color:var(--gold-deep)] shadow-sm" />
                  {/* pulse */}
                  <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-[color:var(--gold)] opacity-0 transition-opacity group-hover:opacity-60 group-hover:animate-ping" />
                </div>
              </button>

              {/* Inner letter panel (mid emerald) */}
              <div
                key={`letter-${animKey}`}
                className="relative px-8 pb-14 pt-20 sm:px-16 sm:pb-16 sm:pt-24 md:px-20"
                style={{ background: "color-mix(in oklab, var(--primary-soft) 90%, var(--primary))" }}
              >
                {/* paper grain */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(245,240,224,0.6) 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                  }}
                />
                <div className="relative flex flex-col items-center text-center">
                  <span className="font-display text-[10px] font-black uppercase tracking-[0.45em] text-[color:var(--gold)]">
                    Correspondence Nº {correspondenceNo} · {item.category}
                  </span>

                  <blockquote
                    key={`quote-${animKey}`}
                    className="mt-8 max-w-2xl text-balance font-serif text-2xl italic leading-relaxed text-[color:var(--parchment)] sm:text-3xl"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    “{item.quote}”
                  </blockquote>

                  <div className="mt-12 w-full max-w-md border-t border-[color:var(--parchment)]/15 pt-6">
                    <Link
                      to="/alumni/$id"
                      params={{ id: item.profile.id }}
                      className="font-display text-sm font-black uppercase tracking-[0.22em] text-[color:var(--gold)] hover:underline"
                    >
                      {item.profile.full_name}, Class of {item.profile.grad_year ?? "—"}
                    </Link>
                    <p className="mt-1.5 text-xs text-[color:var(--parchment)]/55">
                      {item.profile.role_title}
                      {item.profile.company ? ` · ${item.profile.company}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={drawNext}
        className="mt-8 font-display text-[10px] font-black uppercase tracking-[0.28em] text-primary-soft transition-colors hover:text-[color:var(--gold-deep)]"
      >
        ✦ Click the seal to reveal another letter ✦
      </button>
    </div>
  );
}
