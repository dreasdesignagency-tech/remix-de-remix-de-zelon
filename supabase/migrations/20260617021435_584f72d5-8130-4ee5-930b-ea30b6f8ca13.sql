CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  date date,
  start_time time,
  end_time time,
  category text NOT NULL DEFAULT 'reuniao',
  priority text NOT NULL DEFAULT 'medium',
  color text,
  location text,
  meeting_link text,
  client_id uuid REFERENCES public.freelancer_clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  note_id uuid REFERENCES public.notes(id) ON DELETE SET NULL,
  reminders jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own events" ON public.events
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX events_user_date_idx ON public.events(user_id, date);
CREATE INDEX events_client_idx ON public.events(client_id);
CREATE INDEX events_project_idx ON public.events(project_id);
CREATE INDEX events_task_idx ON public.events(task_id);
CREATE INDEX events_note_idx ON public.events(note_id);

CREATE TRIGGER events_touch_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();