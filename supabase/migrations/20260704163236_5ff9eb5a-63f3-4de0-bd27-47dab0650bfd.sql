
-- 1. Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated/public
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, public.notification_type, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_demand_assignment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2. Ensure trigger for assignment notifications is installed
DROP TRIGGER IF EXISTS trg_notify_demand_assignment ON public.demands;
CREATE TRIGGER trg_notify_demand_assignment
  AFTER INSERT OR UPDATE OF assignee_id ON public.demands
  FOR EACH ROW EXECUTE FUNCTION public.notify_demand_assignment();

-- 3. Remove user-facing self-insert on notifications; only server-side triggers create them
DROP POLICY IF EXISTS notif_insert_self ON public.notifications;

-- 4. Avatars bucket: enforce path convention on writes/updates and add explicit public SELECT
DROP POLICY IF EXISTS avatars_authenticated_write ON storage.objects;
CREATE POLICY avatars_authenticated_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_owner_update ON storage.objects;
CREATE POLICY avatars_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_owner_delete ON storage.objects;
CREATE POLICY avatars_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_public_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');
