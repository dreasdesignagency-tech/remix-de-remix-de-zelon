
-- 1. Add 'lider' value to user_role enum (cannot be used in same tx in some PG versions, but ADD VALUE itself is fine)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'lider';

-- 2. Private schema for helpers (not exposed via PostgREST)
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- 3. Recreate helpers in private schema. Use ::text comparisons so function bodies
--    do not need the new enum value to exist at CREATE FUNCTION time.
CREATE OR REPLACE FUNCTION private.get_user_role(_user_id uuid)
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = _user_id $$;

CREATE OR REPLACE FUNCTION private.is_director(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = _user_id AND role::text = 'diretor') $$;

CREATE OR REPLACE FUNCTION private.is_leader(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = _user_id AND role::text = 'lider') $$;

CREATE OR REPLACE FUNCTION private.user_sector(_user_id uuid)
RETURNS public.sector
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE role::text
    WHEN 'diretor' THEN 'diretoria'::public.sector
    WHEN 'social_media' THEN 'social_media'::public.sector
    WHEN 'designer_grafico' THEN 'design'::public.sector
    WHEN 'designer_web' THEN 'design'::public.sector
    WHEN 'videomaker' THEN 'audiovisual'::public.sector
    WHEN 'copywriter' THEN 'copy'::public.sector
    ELSE NULL
  END
  FROM public.profiles WHERE id = _user_id
$$;

REVOKE ALL ON FUNCTION private.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_director(uuid)    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_leader(uuid)      FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.user_sector(uuid)    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.get_user_role(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_director(uuid)    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_leader(uuid)      TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.user_sector(uuid)    TO authenticated, service_role;

-- 4. Recreate policies to use private.* helpers
-- clients
DROP POLICY IF EXISTS clients_select_priv ON public.clients;
DROP POLICY IF EXISTS clients_modify_priv ON public.clients;
CREATE POLICY clients_select_priv ON public.clients FOR SELECT TO authenticated
  USING (private.is_director(auth.uid()));
CREATE POLICY clients_modify_priv ON public.clients FOR ALL TO authenticated
  USING (private.is_director(auth.uid()))
  WITH CHECK (private.is_director(auth.uid()));

-- demands
DROP POLICY IF EXISTS demands_select ON public.demands;
DROP POLICY IF EXISTS demands_insert ON public.demands;
DROP POLICY IF EXISTS demands_update ON public.demands;
DROP POLICY IF EXISTS demands_delete ON public.demands;
CREATE POLICY demands_select ON public.demands FOR SELECT TO authenticated
  USING (private.is_director(auth.uid())
         OR (private.is_leader(auth.uid()) AND private.user_sector(auth.uid()) = sector)
         OR assignee_id = auth.uid()
         OR created_by_id = auth.uid());
CREATE POLICY demands_insert ON public.demands FOR INSERT TO authenticated
  WITH CHECK (private.is_director(auth.uid()) OR private.is_leader(auth.uid()));
CREATE POLICY demands_update ON public.demands FOR UPDATE TO authenticated
  USING (private.is_director(auth.uid())
         OR (private.is_leader(auth.uid()) AND private.user_sector(auth.uid()) = sector)
         OR assignee_id = auth.uid());
CREATE POLICY demands_delete ON public.demands FOR DELETE TO authenticated
  USING (private.is_director(auth.uid())
         OR (private.is_leader(auth.uid()) AND private.user_sector(auth.uid()) = sector)
         OR created_by_id = auth.uid());

-- demand_comments
DROP POLICY IF EXISTS comments_select ON public.demand_comments;
DROP POLICY IF EXISTS comments_insert ON public.demand_comments;
CREATE POLICY comments_select ON public.demand_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.demands d
    WHERE d.id = demand_comments.demand_id
      AND (private.is_director(auth.uid())
           OR (private.is_leader(auth.uid()) AND private.user_sector(auth.uid()) = d.sector)
           OR d.assignee_id = auth.uid()
           OR d.created_by_id = auth.uid())));
CREATE POLICY comments_insert ON public.demand_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.demands d
    WHERE d.id = demand_comments.demand_id
      AND (private.is_director(auth.uid())
           OR (private.is_leader(auth.uid()) AND private.user_sector(auth.uid()) = d.sector)
           OR d.assignee_id = auth.uid()
           OR d.created_by_id = auth.uid())));

-- demand_history
DROP POLICY IF EXISTS history_select ON public.demand_history;
DROP POLICY IF EXISTS history_insert ON public.demand_history;
CREATE POLICY history_select ON public.demand_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.demands d
    WHERE d.id = demand_history.demand_id
      AND (private.is_director(auth.uid())
           OR (private.is_leader(auth.uid()) AND private.user_sector(auth.uid()) = d.sector)
           OR d.assignee_id = auth.uid()
           OR d.created_by_id = auth.uid())));
CREATE POLICY history_insert ON public.demand_history FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND EXISTS (SELECT 1 FROM public.demands d
    WHERE d.id = demand_history.demand_id
      AND (private.is_director(auth.uid())
           OR (private.is_leader(auth.uid()) AND private.user_sector(auth.uid()) = d.sector)
           OR d.assignee_id = auth.uid()
           OR d.created_by_id = auth.uid())));

-- profiles
DROP POLICY IF EXISTS profiles_select_director ON public.profiles;
DROP POLICY IF EXISTS profiles_select_leader_same_sector ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_director ON public.profiles;
DROP POLICY IF EXISTS profiles_update_director ON public.profiles;
DROP POLICY IF EXISTS profiles_delete_director ON public.profiles;
CREATE POLICY profiles_select_director ON public.profiles FOR SELECT TO authenticated
  USING (private.is_director(auth.uid()));
CREATE POLICY profiles_select_leader_same_sector ON public.profiles FOR SELECT TO authenticated
  USING (private.is_leader(auth.uid()) AND private.user_sector(auth.uid()) = private.user_sector(id));
CREATE POLICY profiles_insert_director ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (private.is_director(auth.uid()) AND role::text <> 'diretor');
CREATE POLICY profiles_update_director ON public.profiles FOR UPDATE TO authenticated
  USING (private.is_director(auth.uid()) AND id <> auth.uid())
  WITH CHECK (private.is_director(auth.uid()) AND id <> auth.uid() AND role::text <> 'diretor');
CREATE POLICY profiles_delete_director ON public.profiles FOR DELETE TO authenticated
  USING (private.is_director(auth.uid()) AND id <> auth.uid());

-- 5. Drop public helper functions (no longer referenced by policies)
DROP FUNCTION IF EXISTS public.is_leader(uuid);
DROP FUNCTION IF EXISTS public.is_director(uuid);
DROP FUNCTION IF EXISTS public.user_sector(uuid);
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
