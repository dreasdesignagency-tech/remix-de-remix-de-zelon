
-- 1) Fix is_leader: return true for diretor (top-level leader) so sector-scoped policies grant access as intended
CREATE OR REPLACE FUNCTION public.is_leader(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'diretor'::public.user_role)
$$;

-- 2) Lock down SECURITY DEFINER functions: revoke from PUBLIC/anon; grant only what's needed.
-- RLS helpers must remain callable by authenticated; trigger-only functions are revoked entirely.
REVOKE ALL ON FUNCTION public.is_leader(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_director(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_sector(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_leader(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_director(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_sector(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- Trigger-only functions: no one should call directly
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- 3) Server-side notification creation path (so cross-user notifications don't require client inserts).
-- SECURITY DEFINER function callable only via triggers/service role.
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _type public.notification_type,
  _title text,
  _message text,
  _demand_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO public.notifications(user_id, type, title, message, demand_id)
  VALUES (_user_id, _type, _title, _message, _demand_id)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification(uuid, public.notification_type, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, public.notification_type, text, text, uuid) TO service_role;

-- Trigger: notify assignee when a demand is assigned or reassigned
CREATE OR REPLACE FUNCTION public.notify_demand_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assignee_id IS NOT NULL
     AND NEW.assignee_id <> COALESCE(OLD.assignee_id, '00000000-0000-0000-0000-000000000000'::uuid)
     AND NEW.assignee_id <> auth.uid() THEN
    INSERT INTO public.notifications(user_id, type, title, message, demand_id)
    VALUES (
      NEW.assignee_id,
      'assigned'::public.notification_type,
      'Nova demanda atribuída',
      NEW.title,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_demand_assignment() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS demands_notify_assignment ON public.demands;
CREATE TRIGGER demands_notify_assignment
AFTER INSERT OR UPDATE OF assignee_id ON public.demands
FOR EACH ROW
EXECUTE FUNCTION public.notify_demand_assignment();
