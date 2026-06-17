# LinkedIn-Only Authentication

Replace the current auth page (LinkedIn + Google + email) with a single LinkedIn sign-in flow. On sign-in, auto-fill the user's profile with name, picture, and email from LinkedIn. Job/company/headline stays in the existing onboarding form.

## What gets built

### 1. Secrets
Request `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` via the secure form.

### 2. Auth page rewrite (`src/routes/auth.tsx`)
- Strip Google button, email/password form, name field, sign-up/sign-in toggle.
- Single "Continue with LinkedIn" button → redirects to `/api/auth/linkedin/start`.
- Keep the two-column layout and copy on the left.

### 3. OAuth start route (`src/routes/api/auth/linkedin/start.ts`)
Server route. Generates a random `state`, sets it in an httpOnly cookie, redirects browser to LinkedIn's authorize URL with `response_type=code`, `scope=openid profile email`, our client ID, and the redirect URI.

### 4. OAuth callback route (`src/routes/api/auth/linkedin/callback.ts`)
Server route. Steps:
1. Verify `state` cookie matches query param.
2. Exchange `code` for access token at LinkedIn's token endpoint.
3. Fetch `/v2/userinfo` → get `sub` (LinkedIn ID), `name`, `email`, `picture`.
4. Use `supabaseAdmin` to:
   - Look up existing user by email via Auth Admin API.
   - If not found, create user with `email_confirm: true` and metadata `{ full_name, avatar_url, linkedin_id }`. The existing `handle_new_user` trigger auto-creates the profile row.
   - If found, update user metadata so name/picture stay fresh.
5. Generate a magic link via `supabaseAdmin.auth.admin.generateLink({ type: 'magiclink' })`, extract the token hash, and redirect the browser to `/auth/verify?token_hash=...&type=magiclink&next=/onboarding-or-profile`.

### 5. Verify route (`src/routes/auth.verify.tsx`)
Client-side page that calls `supabase.auth.verifyOtp({ token_hash, type })` to establish the session, then navigates to `/onboarding` (new users) or `/profile` (returning users) based on whether profile has `headline` filled.

### 6. Header cleanup (`src/components/SiteHeader.tsx`)
Change "Sync LinkedIn" CTA label → "Sign in with LinkedIn" (already routes to `/auth`).

### 7. Disable email provider in Lovable Cloud
Call `supabase--configure_social_auth` with `disable_providers: ["email", "google"]` — wait, email needs to stay enabled because we use magic-link OTP verification internally to create the session. Keep email enabled at the backend level; the UI just doesn't expose it.

## Technical notes

- Redirect URI: `https://id-preview--281b90a9-c620-408e-9a23-7c21974e3f68.lovable.app/api/auth/linkedin/callback`
- LinkedIn endpoints:
  - Authorize: `https://www.linkedin.com/oauth/v2/authorization`
  - Token: `https://www.linkedin.com/oauth/v2/accessToken`
  - Userinfo: `https://api.linkedin.com/v2/userinfo`
- `supabaseAdmin` loaded inside handlers via `await import('@/integrations/supabase/client.server')` (route files are client-reachable).
- State cookie: httpOnly, secure, sameSite=lax, 10-min maxAge.
- The `handle_new_user` trigger already reads `full_name` and `avatar_url` from `raw_user_meta_data` — no DB changes needed.

## Out of scope
- Job title / company / headline pulling from LinkedIn (requires partner approval). Stays in manual onboarding.
- Production redirect URL (add after publish).
