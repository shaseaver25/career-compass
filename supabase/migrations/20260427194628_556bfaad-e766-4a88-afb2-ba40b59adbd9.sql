
-- Fix mutable search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Restrict has_role execute to the database (RLS only)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;

-- Replace broad SELECT policies on storage with metadata-restricted ones
DROP POLICY IF EXISTS "logos public read" ON storage.objects;
DROP POLICY IF EXISTS "audio public read" ON storage.objects;
-- Files are still served via public bucket URL; we just prevent listing through the API.
CREATE POLICY "logos auth list own" ON storage.objects FOR SELECT USING (
  bucket_id = 'company-logos' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);
CREATE POLICY "audio auth list own" ON storage.objects FOR SELECT USING (
  bucket_id = 'interview-audio' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);
