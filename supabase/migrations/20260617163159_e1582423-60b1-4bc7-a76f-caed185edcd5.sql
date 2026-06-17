-- Remove synthetic seed data so the app is production-ready.
-- Previously, a migration auto-assigned a random department to existing profiles
-- via hashtext(). Wipe those values so users supply real data via onboarding.
UPDATE public.profiles SET department = NULL WHERE department IS NOT NULL;

-- Also clear any city/coordinates that were auto-populated without lat/lng pairs,
-- and remove cities that have no coordinates (these can't be shown on the map anyway).
UPDATE public.profiles
  SET city_name = NULL, city_lat = NULL, city_lng = NULL
  WHERE (city_lat IS NULL OR city_lng IS NULL);