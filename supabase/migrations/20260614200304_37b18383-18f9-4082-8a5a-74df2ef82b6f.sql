
-- 1. Companies: hide sensitive contact columns from anonymous role
REVOKE SELECT (
  internal_contact_name,
  internal_contact_email,
  internal_contact_phone,
  school_relations_contact_name,
  school_relations_contact_email
) ON public.companies FROM anon;

-- 2. Analytics: validate insert payload with allowlist + length limits
DROP POLICY IF EXISTS "events anon insert" ON public.analytics_events;
CREATE POLICY "events insert validated"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_name IN (
    'page_view','company_view','career_view','interview_view','interview_play',
    'opportunity_view','opportunity_click','bookmark_add','bookmark_remove',
    'search','filter_apply','external_click','cluster_select','share'
  )
  AND length(event_name) <= 64
  AND (user_agent IS NULL OR length(user_agent) <= 512)
  AND (referrer IS NULL OR length(referrer) <= 1024)
  AND (anonymous_session_id IS NULL OR length(anonymous_session_id) <= 128)
);

-- 3. Storage SELECT (listing) policies for thumbnails & testimonial photos
DROP POLICY IF EXISTS "interview thumbnails owner list" ON storage.objects;
CREATE POLICY "interview thumbnails owner list"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'interview-thumbnails'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

DROP POLICY IF EXISTS "testimonial photos owner list" ON storage.objects;
CREATE POLICY "testimonial photos owner list"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'testimonial-photos'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- 4. Storage write policies require the user to own at least one company
-- company-logos
DROP POLICY IF EXISTS "logos owner write" ON storage.objects;
CREATE POLICY "logos owner write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (SELECT 1 FROM public.companies WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "logos owner update" ON storage.objects;
CREATE POLICY "logos owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (SELECT 1 FROM public.companies WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "logos owner delete" ON storage.objects;
CREATE POLICY "logos owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (SELECT 1 FROM public.companies WHERE owner_id = auth.uid())
);

-- interview-thumbnails
DROP POLICY IF EXISTS "interview thumbnails owner write" ON storage.objects;
CREATE POLICY "interview thumbnails owner write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'interview-thumbnails'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (SELECT 1 FROM public.companies WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "interview thumbnails owner update" ON storage.objects;
CREATE POLICY "interview thumbnails owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'interview-thumbnails'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (SELECT 1 FROM public.companies WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "interview thumbnails owner delete" ON storage.objects;
CREATE POLICY "interview thumbnails owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'interview-thumbnails'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (SELECT 1 FROM public.companies WHERE owner_id = auth.uid())
);

-- testimonial-photos
DROP POLICY IF EXISTS "testimonial photos owner write" ON storage.objects;
CREATE POLICY "testimonial photos owner write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'testimonial-photos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (SELECT 1 FROM public.companies WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "testimonial photos owner update" ON storage.objects;
CREATE POLICY "testimonial photos owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'testimonial-photos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (SELECT 1 FROM public.companies WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "testimonial photos owner delete" ON storage.objects;
CREATE POLICY "testimonial photos owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'testimonial-photos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (SELECT 1 FROM public.companies WHERE owner_id = auth.uid())
);

-- interview-audio
DROP POLICY IF EXISTS "audio owner write" ON storage.objects;
CREATE POLICY "audio owner write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'interview-audio'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (SELECT 1 FROM public.companies WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "audio owner update" ON storage.objects;
CREATE POLICY "audio owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'interview-audio'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (SELECT 1 FROM public.companies WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "audio owner delete" ON storage.objects;
CREATE POLICY "audio owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'interview-audio'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (SELECT 1 FROM public.companies WHERE owner_id = auth.uid())
);

-- 5. Restrict EXECUTE on handle_new_user — it's a trigger-only function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
