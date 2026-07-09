
-- Add WITH CHECK to update policies
DROP POLICY IF EXISTS notes_update_own ON public.notes;
CREATE POLICY notes_update_own ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS notif_update ON public.notifications;
CREATE POLICY notif_update ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS projects_update_own ON public.projects;
CREATE POLICY projects_update_own ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS tasks_update_own ON public.tasks;
CREATE POLICY tasks_update_own ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Restrict freelancer_clients policies to authenticated role
DROP POLICY IF EXISTS fc_select_own ON public.freelancer_clients;
CREATE POLICY fc_select_own ON public.freelancer_clients FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS fc_insert_own ON public.freelancer_clients;
CREATE POLICY fc_insert_own ON public.freelancer_clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS fc_update_own ON public.freelancer_clients;
CREATE POLICY fc_update_own ON public.freelancer_clients FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS fc_delete_own ON public.freelancer_clients;
CREATE POLICY fc_delete_own ON public.freelancer_clients FOR DELETE TO authenticated USING (auth.uid() = user_id);
