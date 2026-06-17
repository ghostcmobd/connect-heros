## Alumni Networking Web App — Build Plan

A production-ready alumni networking platform with a light, airy sage-accented aesthetic, real backend, real auth, and real LinkedIn-style onboarding.

### Visual System

- Palette: off-white `#fafaf7` background, surface `#eef2ec`, sage `#b7cdb5`, deep sage `#4b6b52` for text/CTAs. Neutral ink `#1f2421`.
- Type: Plus Jakarta Sans (display + body) loaded via `<link>` in `__root.tsx`, declared in `@theme`.
- Motion: Framer Motion for fade-in-on-scroll, hover lift (translateY -2px + soft shadow), button tap scale 0.97. Respects `prefers-reduced-motion`.
- No emojis. Lucide icons only. Realistic copy throughout — named alumni, real companies (Stripe, Figma, Linear, Anthropic, McKinsey, Genentech, etc.), real grad years 2014–2024.

### Pages / Routes

```
/              Words of Wisdom Wall (masonry, public)
/map           Interactive Alumni Map (Leaflet, public)
/directory     Searchable Alumni Directory (public)
/alumni/$id    Public profile page
/auth          Sign in / sign up (email + "Sync with LinkedIn")
/_authenticated/
  onboarding   Complete profile after LinkedIn/email signup
  profile      Edit my profile, advice, help-tags, location
  messages     Inbox for student->alumni outreach (basic)
```

Shared header with sage-on-white nav and a prominent "Sync with LinkedIn" CTA when signed out.

### Feature Details

**1. Words of Wisdom Wall (`/`)**
- CSS masonry (column-count responsive: 1/2/3/4).
- Card: quote, name, "Class of YYYY", current role @ company, small sage avatar ring.
- Loaded from `wisdom` table joined to `profiles`; cards fade-in on scroll (IntersectionObserver + framer).
- Filter chips: All / Career / Academics / Life / Internships.

**2. Interactive Alumni Map (`/map`)**
- Leaflet + OpenStreetMap tiles, custom sage pin SVG, `leaflet.markercluster` for city clusters.
- Hover/click cluster -> sleek tooltip card listing up to 5 alumni in that city with role and a "View" link to their profile.
- Data: `profiles.city_lat`, `profiles.city_lng`, `profiles.city_name`.

**3. Alumni Directory (`/directory`)**
- Search by name/company/role; filter by grad year range, help-tag, city.
- Profile cards with soft border, hover lift, prominent "Message to Juniors" pull-quote, pill tags (Resume Review, Mock Interviews, Coffee Chat, Referrals, Portfolio Critique, Grad School Advice, Startup Advice, Negotiation Help).
- "Reach out" button -> opens message composer (authenticated only).

**4. Frictionless Onboarding (`/auth`)**
- Big "Sync with LinkedIn — 1-click signup" button using Supabase Auth LinkedIn OIDC provider. Below it: email/password fallback.
- After signup, redirect to `/onboarding`: prefill name/headline/company from LinkedIn claims, ask user to pick help-tags, set city (geocoded via OpenStreetMap Nominatim), add a "Message to Juniors" quote, add a Words of Wisdom snippet.
- LinkedIn requires the user to enable the LinkedIn provider in Cloud auth settings with their LinkedIn OAuth client id/secret — I'll surface a clear in-app notice and docs link if the provider isn't configured, with email/password working immediately.

### Backend (Lovable Cloud)

Tables (all with grants + RLS):

- `profiles` (id uuid PK = auth.users.id, full_name, headline, company, role_title, grad_year int, city_name, city_lat, city_lng, avatar_url, message_to_juniors text, linkedin_url, created_at)
- `help_tags` (id, slug, label) — seeded
- `profile_help_tags` (profile_id, tag_id) — many-to-many
- `wisdom` (id, profile_id FK, category enum, quote text, created_at)
- `messages` (id, sender_id, recipient_id, body, created_at, read_at)
- `user_roles` + `app_role` enum + `has_role()` SECURITY DEFINER (per project rules)

RLS:
- `profiles`, `wisdom`, `help_tags`, `profile_help_tags`: `SELECT TO anon, authenticated` (public directory).
- INSERT/UPDATE on own profile/wisdom: `auth.uid() = profile_id`.
- `messages`: SELECT/INSERT where `auth.uid() IN (sender_id, recipient_id)`; recipient can UPDATE `read_at`.
- `user_roles`: authenticated SELECT only; admin-only writes.

Seed migration inserts ~40 realistic alumni profiles across cities (SF, NYC, London, Berlin, Bangalore, Singapore, Toronto, Austin, Seattle, Boston, Amsterdam, Tokyo), ~80 wisdom snippets, full tag set. Names like Sarah Jenkins, Marcus Okafor, Priya Raman, Daniel Levy, Mei Tanaka, etc. Companies: Stripe, Figma, Linear, Anthropic, Notion, McKinsey, Genentech, Two Sigma, Shopify, Atlassian, Spotify, ARM, BCG, Airbnb.

Auto-create `profiles` row on signup via `handle_new_user()` trigger pulling `raw_user_meta_data` (LinkedIn provides name, picture, headline).

### Server Functions

- `getWisdomFeed({ category?, cursor? })` — public publishable-key client, paginated.
- `getDirectory({ q?, gradYearMin?, gradYearMax?, tagSlugs?, city? })` — public.
- `getMapPins()` — public, returns aggregated city clusters + alumni snippets.
- `getAlumnusById(id)` — public.
- `updateMyProfile(...)` — auth-protected via `requireSupabaseAuth`.
- `upsertMyWisdom(...)` — auth-protected.
- `sendMessage({ recipientId, body })` — auth-protected.
- `geocodeCity(name)` — server-side Nominatim fetch (cached).

### Technical Section

- Stack: TanStack Start + React 19 + Tailwind v4, Lovable Cloud (Supabase) for DB/auth, Framer Motion, Leaflet + react-leaflet + leaflet.markercluster, Lucide, TanStack Query (loader `ensureQueryData` + `useSuspenseQuery`).
- Install: `bun add framer-motion react-leaflet leaflet leaflet.markercluster @types/leaflet`.
- Leaflet CSS: load via CDN `<link>` in `__root.tsx` head (Tailwind v4 forbids remote `@import` in `styles.css`).
- Map is client-only (`{ ssr: false }` on `/map` or dynamic import) — Leaflet touches `window`.
- LinkedIn auth: `supabase.auth.signInWithOAuth({ provider: 'linkedin_oidc', options: { redirectTo: window.location.origin + '/onboarding' } })`. If provider 400s, show a friendly notice that LinkedIn isn't configured yet and link to Cloud auth settings.
- All `<a href>` for app routes replaced with `<Link>`; each route file has its own `head()` meta (title, description, og:title, og:description).
- Error/notFound boundaries on every route with a loader; root has `notFoundComponent`.
- Public routes use the publishable Supabase client for SSR-safe loads. Protected routes live under `/_authenticated`.

### What you'll get at the end

A polished, deployable alumni site with a sage-on-white aesthetic, a real seeded directory, an interactive clustered world map, a masonry wisdom wall, working email + LinkedIn-ready authentication, and a clean onboarding flow — all backed by real tables and RLS.