REVOKE EXECUTE ON FUNCTION public.is_director(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_leader(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_sector(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_director(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_leader(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_sector(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS notif_insert ON public.notifications;

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;

CREATE POLICY profiles_update_self
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
  );