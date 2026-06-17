# Add Department + Student ID to Onboarding

Add a required **Department** picker (grouped: Graduate / Undergraduate) and a required **Student ID** text field to the alumni onboarding form. Both display on the public profile alongside role and company.

## Database

The `profiles.department` column already exists. Add `student_id`:

```sql
ALTER TABLE public.profiles ADD COLUMN student_id text;
```

No RLS change needed — existing profile policies cover it.

## Department list (hardcoded constant)

```ts
// src/lib/departments.ts
export const DEPARTMENTS = {
  "Graduate Programs": [
    "Master of Business Administration (MBA)",
    "Masters of Public Health (MPH)",
    "MSc in CSE",
    "MSc in CE",
  ],
  "Undergraduate Programs": [
    "Bachelor of Computer Science and Engineering (BCSE)",
    "Bachelor of Science in Civil Engineering (BSCE)",
    "Bachelor of Science in Electrical & Electronic Engineering (BSEEE)",
    "Bachelor of Science in Mechanical Engineering (BSME)",
    "Bachelor of Business Administration (BBA)",
    "Bachelor of Science in Agriculture (BSAg)",
    "Bachelor of Arts in Tourism and Hospitality Management (BATHM)",
    "Bachelor of Arts in Economics (BAEcon)",
    "Bachelor of Science in Nursing (BSN)",
    "Bachelor of Arts in English (BAEng)",
  ],
} as const;
```

Stored as the full label string (e.g. `"Bachelor of Computer Science and Engineering (BCSE)"`).

## Onboarding form changes (`src/routes/_authenticated/onboarding.tsx`)

1. Add `department` and `student_id` to `form` state, prefill from `meQ.data`.
2. New **Department** field above "Role": a styled dropdown (`<select>`) with two `<optgroup>`s for Graduate and Undergraduate, marked required.
3. New **Student ID** text input next to it (in the 2-col grid), marked required.
4. Client-side validation: block submit if either is empty, show toast.
5. Pass `department` and `student_id` to `updateFn` in the submit payload.

## Server function update (`src/lib/me.functions.ts`)

Extend `updateMyProfile`'s input validator to accept `department: string | null` and `student_id: string | null`, and include both in the update payload to `profiles`. Add a length cap (`student_id` max 64 chars, `department` max 200) for safety.

## Public profile display (`src/routes/alumni.$id.tsx` + `src/components/AlumniCard.tsx`)

- Show department as a small pill/badge near the role line.
- Do **not** display `student_id` publicly — it's identity-verification data only. Visible only to the user themselves on `/profile` and `/onboarding`.

## Out of scope

- No uniqueness constraint on `student_id` for now (can add later if you want to prevent duplicate registrations).
- No admin verification flow — IDs are self-reported.
