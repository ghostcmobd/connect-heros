
ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
-- profiles.id stays PK; trigger on auth.users still inserts the matching row for new signups.
