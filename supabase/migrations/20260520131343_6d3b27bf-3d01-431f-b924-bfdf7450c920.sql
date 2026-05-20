
DROP POLICY IF EXISTS "deed_sync_log service insert" ON public.deed_sync_log;
CREATE POLICY "deed_sync_log admin insert" ON public.deed_sync_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
