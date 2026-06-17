
-- 1) Hide student_id from anonymous (unauthenticated) viewers
REVOKE SELECT (student_id) ON public.profiles FROM anon;

-- 2) Prevent users from self-verifying / changing is_published via a trigger
CREATE OR REPLACE FUNCTION public.profiles_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin'::public.app_role);
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified AND NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can change verification status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_privileged_columns ON public.profiles;
CREATE TRIGGER profiles_guard_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_guard_privileged_columns();

-- 3) Switch has_role to SECURITY INVOKER so it no longer runs with elevated privileges.
--    The user_roles SELECT policy already restricts each user to their own rows,
--    so RLS calls like has_role(auth.uid(), 'admin') continue to work correctly.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
