DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;

CREATE POLICY profiles_insert_self ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id AND role <> 'diretor'::public.user_role);