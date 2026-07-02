
-- 1. Notifications INSERT policy
CREATE POLICY "notif_insert_self" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 2. Prevent directors from creating new director accounts
DROP POLICY IF EXISTS profiles_insert_director ON public.profiles;
CREATE POLICY profiles_insert_director ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (is_director(auth.uid()) AND role <> 'diretor'::user_role);

-- 3. Revoke SECURITY DEFINER function access from anon/public
REVOKE ALL ON FUNCTION public.user_sector(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_director(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_leader(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.user_sector(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_director(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_leader(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
