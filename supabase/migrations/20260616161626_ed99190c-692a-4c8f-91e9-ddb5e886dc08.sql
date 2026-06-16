
-- Fix EXPOSED_SENSITIVE_DATA: prevent anonymous visitors from reading internal contact fields
REVOKE SELECT (
  school_relations_contact_name,
  school_relations_contact_email,
  internal_contact_name,
  internal_contact_email,
  internal_contact_phone
) ON public.companies FROM anon;

-- Fix audit_log actor_id spoofing
DROP POLICY IF EXISTS "audit insert authed" ON public.audit_log;
CREATE POLICY "audit insert authed"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND (actor_id = auth.uid() OR actor_id IS NULL));
