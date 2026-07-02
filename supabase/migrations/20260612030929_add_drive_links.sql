ALTER TABLE public.freelancer_clients
  ADD COLUMN IF NOT EXISTS drive_links jsonb NOT NULL DEFAULT '[]'::jsonb;
