## Problem

The Directory's department dropdown is populated from distinct values found in the `profiles` table (`getDepartments` server fn). Since few/no profiles use the new canonical department names yet, the dropdown looks empty or stale — it doesn't reflect the full list we added to the onboarding form.

## Fix

Make the Directory filter use the same canonical `DEPARTMENTS` constant the onboarding form uses, grouped by Graduate / Undergraduate.

### Changes

**`src/routes/directory.tsx`**
- Drop the `getDepartments` server-fn query (no DB round-trip needed).
- Import `DEPARTMENTS` from `@/lib/departments`.
- Render the `<select>` with two `<optgroup>`s (Graduate Programs, Undergraduate Programs) — same shape as the onboarding form, so labels match exactly and a saved profile value lines up with a filter option.
- Keep "All departments" as the default option.

**`src/lib/site.functions.ts`**
- Remove the now-unused `getDepartments` export (small cleanup, prevents drift).

No schema change, no migration, no impact on existing profiles.
