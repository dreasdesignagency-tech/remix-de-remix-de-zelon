-- Allow directors to read all profiles, and leaders to read profiles within their sector,
-- so they can assign demands to teammates from the Demandas kanban.

CREATE POLICY "profiles_select_director"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_director(auth.uid()));

CREATE POLICY "profiles_select_leader_same_sector"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.is_leader(auth.uid())
  AND public.user_sector(auth.uid()) = public.user_sector(id)
);
