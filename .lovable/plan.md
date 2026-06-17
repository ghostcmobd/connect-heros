# Almanac redesign — The Archivist Modern

Rebuild the home page in the locked Emerald Prestige direction (deep emerald, gold, parchment, Urbanist + Epilogue) and propagate the tokens so the rest of the app stops looking generic.

## 1. Design system (site-wide)

Update `src/styles.css`:
- Install Urbanist + Epilogue via `@fontsource-variable/urbanist` and `@fontsource-variable/epilogue` (bun add), import in `src/start.tsx` / `__root.tsx`.
- Replace the current color tokens under `:root` and `@theme inline`:
  - `--background` parchment `oklch(0.96 0.022 90)` (≈ #f5f0e0)
  - `--foreground` deep emerald `oklch(0.32 0.06 160)` (≈ #064e3b)
  - `--primary` emerald `oklch(0.32 0.06 160)` / `--primary-foreground` parchment
  - `--secondary` mid emerald `oklch(0.50 0.10 160)` (≈ #0d7a5f)
  - `--accent` gold `oklch(0.78 0.13 85)` (≈ #c9a84c)
  - `--surface` white, `--muted` parchment-tinted, `--border` gold/10
  - `--shadow-elegant` soft emerald-tinted shadow
- Map `--font-display: "Urbanist Variable"`, `--font-sans: "Epilogue Variable"` under `@theme`.
- Add utilities: `.eyebrow` (small-caps gold), `.gold-rule` (1px gold hairline), `.archive-card` (white card + gold/10 border + hover gold border + shadow).

## 2. Home page (`src/routes/index.tsx`)

Three stacked sections inside a `max-w-7xl` container with generous gap (mirrors the prototype):

### Hero — split rounded card
- White rounded `2rem` card with gold/10 border, big shadow, `h-[700px]`.
- Left half: real Leaflet map (`AlumniMap`) on emerald background; keep the existing cartoon waving pins (already gold/emerald). Add a bottom-left "Global Wisdom Network" small-caps label and a top-right live-counter chip.
- Right half (white): gold hairline + "Est. Alumni Registry" eyebrow → Urbanist 6xl/8xl headline "Where / **Alumni** (gold) / Lead." → alumni count chip (`+{totalAlumni}` avatar + "12,480 alumni across N cities") → CTAs: filled emerald "Browse directory", outlined "Swipe to match", and a tertiary `Sync with LinkedIn` link with the LinkedIn glyph.

### Section: Alumni open to chat
- Header row: Urbanist 4xl "Live Mentorship" + "Alumni currently online…" sub + right-aligned live pulse "{n} Active now".
- 3-column grid powered by existing `ShufflingAlumni` (kept as 3, 5s interval). Rebuild `AlumniCard` to the prototype shape: gold-ringed avatar (grayscale → color on hover), Urbanist name, gold uppercase role @ company, short message, parchment-fill "Send message" button that inverts to emerald on hover.

### Section: Words of wisdom — envelope
- Wrap `WisdomLetterbox` in the prototype's emerald frame: outer emerald rounded card with 1px gold padding, inner mid-emerald letter panel; gold wax seal sits at top-center with "A" monogram; "Correspondence No. {n}" eyebrow above the quote; quote in italic Epilogue 2xl/3xl on parchment text; gold uppercase signature + role beneath a gold/10 hairline. Keep the existing tap-to-shuffle logic; the seal is the tap target. Pulsing "Click the seal to reveal another letter" caption below.

## 3. Shared chrome

- `SiteHeader`: parchment background, Urbanist wordmark with a small gold dot, nav in Epilogue uppercase small-caps with gold underline on active; CTA becomes gold-outlined "Sync LinkedIn".
- `SiteFooter`: gold hairline top border, Urbanist mark, Epilogue link grid.

## 4. Map polish (`AlumniMap.tsx`)

Already has cartoon pins — adjust palette only: shirt gradient → `#c9a84c → #b08a2e` for gold pins (hub cities), `#0d7a5f → #064e3b` for emerald pins (smaller cities); badge background gold for emerald pins, emerald for gold pins. Map basemap stays Carto Voyager; add an emerald tinted overlay (`mix-blend-multiply`) so it harmonises with the hero panel.

## 5. Cleanup

- Drop unused icons / sections in `index.tsx` (no more `MessageCircle`/"How it works" remnants).
- Remove `src/components/WisdomCard.tsx` if still unreferenced.

## Out of scope

- Other routes (`/directory`, `/match`, `/wisdom`, `/alumni/$id`) keep current structure; they inherit the new tokens but no layout changes this pass.
- No schema or server-function changes.
- No new data fields.
