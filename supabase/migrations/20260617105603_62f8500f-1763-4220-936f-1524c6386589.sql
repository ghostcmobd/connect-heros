
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.wisdom_category AS ENUM ('career', 'academics', 'life', 'internships');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  headline TEXT,
  company TEXT,
  role_title TEXT,
  grad_year INT,
  city_name TEXT,
  city_lat DOUBLE PRECISION,
  city_lng DOUBLE PRECISION,
  avatar_url TEXT,
  message_to_juniors TEXT,
  linkedin_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (is_published = true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Help tags
CREATE TABLE public.help_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL
);
GRANT SELECT ON public.help_tags TO anon, authenticated;
GRANT ALL ON public.help_tags TO service_role;
ALTER TABLE public.help_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Help tags are public"
  ON public.help_tags FOR SELECT USING (true);

CREATE TABLE public.profile_help_tags (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.help_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, tag_id)
);
GRANT SELECT ON public.profile_help_tags TO anon, authenticated;
GRANT INSERT, DELETE ON public.profile_help_tags TO authenticated;
GRANT ALL ON public.profile_help_tags TO service_role;
ALTER TABLE public.profile_help_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profile tags are public"
  ON public.profile_help_tags FOR SELECT USING (true);
CREATE POLICY "Users manage own profile tags - insert"
  ON public.profile_help_tags FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users manage own profile tags - delete"
  ON public.profile_help_tags FOR DELETE TO authenticated
  USING (auth.uid() = profile_id);

-- Wisdom
CREATE TABLE public.wisdom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category public.wisdom_category NOT NULL DEFAULT 'career',
  quote TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX wisdom_profile_idx ON public.wisdom(profile_id);
CREATE INDEX wisdom_created_idx ON public.wisdom(created_at DESC);
GRANT SELECT ON public.wisdom TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.wisdom TO authenticated;
GRANT ALL ON public.wisdom TO service_role;
ALTER TABLE public.wisdom ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wisdom is public"
  ON public.wisdom FOR SELECT USING (true);
CREATE POLICY "Users insert own wisdom"
  ON public.wisdom FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users update own wisdom"
  ON public.wisdom FOR UPDATE TO authenticated
  USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users delete own wisdom"
  ON public.wisdom FOR DELETE TO authenticated
  USING (auth.uid() = profile_id);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);
CREATE INDEX messages_recipient_idx ON public.messages(recipient_id, created_at DESC);
CREATE INDEX messages_sender_idx ON public.messages(sender_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() IN (sender_id, recipient_id));
CREATE POLICY "Sender can insert"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipient can mark read"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, headline)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'headline'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
