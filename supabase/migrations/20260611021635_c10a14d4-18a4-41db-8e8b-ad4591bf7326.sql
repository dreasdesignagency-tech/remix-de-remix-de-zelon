
CREATE TABLE public.freelancer_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  company text,
  instagram text,
  whatsapp text,
  email text,
  site text,
  niche text,
  status text NOT NULL DEFAULT 'ativo',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.freelancer_clients TO authenticated;
GRANT ALL ON public.freelancer_clients TO service_role;

ALTER TABLE public.freelancer_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fc_select_own" ON public.freelancer_clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fc_insert_own" ON public.freelancer_clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fc_update_own" ON public.freelancer_clients FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fc_delete_own" ON public.freelancer_clients FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_freelancer_clients_updated
BEFORE UPDATE ON public.freelancer_clients
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.freelancer_clients(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.freelancer_clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
