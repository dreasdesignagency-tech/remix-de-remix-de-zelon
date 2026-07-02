-- Drop policies que dependem da coluna role/get_user_role
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_director ON public.profiles;
DROP POLICY IF EXISTS clients_modify_priv ON public.clients;
DROP POLICY IF EXISTS clients_select_priv ON public.clients;

-- get_user_role retorna user_role, precisa cair para trocar o enum
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Trocar enum
ALTER TYPE public.user_role RENAME TO user_role_old;

CREATE TYPE public.user_role AS ENUM (
  'diretor',
  'social_media',
  'designer_grafico',
  'designer_web',
  'videomaker',
  'copywriter'
);

ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.profiles
  ALTER COLUMN role TYPE public.user_role
  USING (
    CASE role::text
      WHEN 'diretor' THEN 'diretor'
      WHEN 'lideranca_social_media' THEN 'social_media'
      WHEN 'social_media' THEN 'social_media'
      WHEN 'designer_social_media' THEN 'designer_grafico'
      WHEN 'designer' THEN 'designer_grafico'
      WHEN 'videomaker' THEN 'videomaker'
      WHEN 'lideranca_audiovisual' THEN 'videomaker'
      WHEN 'copywriter' THEN 'copywriter'
      WHEN 'lideranca_planejamento' THEN 'copywriter'
      WHEN 'planejamento' THEN 'copywriter'
      ELSE 'social_media'
    END
  )::public.user_role;

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'social_media'::public.user_role;

DROP TYPE public.user_role_old;

-- Recriar get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = _user_id $$;

-- Sem cargos de liderança no novo modelo
CREATE OR REPLACE FUNCTION public.is_leader(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT false $$;

-- Atualizar mapeamento de setor (designer_web no setor design)
CREATE OR REPLACE FUNCTION public.user_sector(_user_id uuid)
RETURNS public.sector
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE role
    WHEN 'diretor' THEN 'diretoria'::public.sector
    WHEN 'social_media' THEN 'social_media'::public.sector
    WHEN 'designer_grafico' THEN 'design'::public.sector
    WHEN 'designer_web' THEN 'design'::public.sector
    WHEN 'videomaker' THEN 'audiovisual'::public.sector
    WHEN 'copywriter' THEN 'copy'::public.sector
  END
  FROM public.profiles WHERE id = _user_id
$$;

-- Atualizar default do trigger handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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

-- Recriar policies
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY profiles_update_director ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_director(auth.uid()) AND id <> auth.uid())
  WITH CHECK (
    public.is_director(auth.uid())
    AND id <> auth.uid()
    AND role <> 'diretor'::public.user_role
  );

CREATE POLICY clients_select_priv ON public.clients
  FOR SELECT TO authenticated
  USING (public.is_director(auth.uid()));

CREATE POLICY clients_modify_priv ON public.clients
  FOR ALL TO authenticated
  USING (public.is_director(auth.uid()))
  WITH CHECK (public.is_director(auth.uid()));