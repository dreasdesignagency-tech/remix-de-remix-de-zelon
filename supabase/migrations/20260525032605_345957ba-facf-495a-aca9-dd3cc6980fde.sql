
-- 1. Fix mutable search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin new.updated_at = now(); return new; end
$function$;

-- 2. Revoke EXECUTE on SECURITY DEFINER role helpers from clients.
-- These should only be called from within RLS policies (which run regardless of grants).
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_director(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_leader(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_sector(uuid) FROM PUBLIC, anon, authenticated;

-- 3. Prevent privilege escalation: users cannot change their own role via self-update.
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- 4. Notifications: only allow inserting notifications targeted at the caller.
DROP POLICY IF EXISTS notif_insert ON public.notifications;
CREATE POLICY notif_insert ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 5. demand_history: require the actor to actually have access to the referenced demand.
DROP POLICY IF EXISTS history_insert ON public.demand_history;
CREATE POLICY history_insert ON public.demand_history
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.demands d
      WHERE d.id = demand_history.demand_id
        AND (
          public.is_director(auth.uid())
          OR (public.is_leader(auth.uid()) AND public.user_sector(auth.uid()) = d.sector)
          OR d.assignee_id = auth.uid()
          OR d.created_by_id = auth.uid()
        )
    )
  );

-- 6. Avatars bucket: bucket is public so direct URL access still works via CDN,
-- but the broad SELECT policy currently lets clients LIST every file in the bucket.
DROP POLICY IF EXISTS avatars_public_read ON storage.objects;

-- 7. Realtime: app does not use realtime subscriptions, and realtime.messages has
-- no RLS policies, so any signed-in user could subscribe to row changes from
-- legacy tables (clients, demands, notifications, profiles, …) and bypass RLS.
-- Remove every public table from the realtime publication.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
  LOOP
    EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE %I.%I', r.schemaname, r.tablename);
  END LOOP;
END $$;
