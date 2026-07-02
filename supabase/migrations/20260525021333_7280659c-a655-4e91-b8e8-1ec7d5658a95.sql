
-- Profile: add personal fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS weekly_goal integer NOT NULL DEFAULT 20;

-- Replace handle_new_user to populate name, email, phone from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles(id, name, email, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Usuário'),
    new.email,
    NULLIF(new.raw_user_meta_data->>'phone', ''),
    'social_media'::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow users to insert their own profile (fallback) — already have update/select policies
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Tighten profiles SELECT to only own profile (replaces permissive policy)
DROP POLICY IF EXISTS profiles_select_auth ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- ===== TASKS =====
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  date date,
  start_time text,
  end_time text,
  category text NOT NULL DEFAULT 'personal',
  priority text NOT NULL DEFAULT 'medium',
  completed boolean NOT NULL DEFAULT false,
  project_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select_own ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY tasks_insert_own ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY tasks_update_own ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY tasks_delete_own ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tasks_user_idx ON public.tasks(user_id);

CREATE TRIGGER tasks_touch BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== NOTES =====
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY notes_select_own ON public.notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY notes_insert_own ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY notes_update_own ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY notes_delete_own ON public.notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notes_user_idx ON public.notes(user_id);

CREATE TRIGGER notes_touch BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== PROJECTS =====
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  client text,
  description text,
  status text NOT NULL DEFAULT 'idea',
  deadline date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_select_own ON public.projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY projects_insert_own ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY projects_update_own ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY projects_delete_own ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS projects_user_idx ON public.projects(user_id);

CREATE TRIGGER projects_touch BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- profiles touch trigger
DROP TRIGGER IF EXISTS profiles_touch ON public.profiles;
