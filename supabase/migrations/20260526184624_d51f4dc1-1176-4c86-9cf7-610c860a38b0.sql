DROP POLICY IF EXISTS profiles_update_director ON public.profiles;

CREATE POLICY profiles_update_director
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_director(auth.uid()) AND id <> auth.uid())
WITH CHECK (
  is_director(auth.uid())
  AND id <> auth.uid()
  AND role <> 'diretor'::public.user_role
);