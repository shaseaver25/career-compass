ALTER TABLE public.careers
  ADD COLUMN IF NOT EXISTS ai_cs_application TEXT,
  ADD COLUMN IF NOT EXISTS media_resources JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS anchor_opportunity JSONB,
  ADD COLUMN IF NOT EXISTS estimated_salary_low INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_salary_high INTEGER,
  ADD COLUMN IF NOT EXISTS education_pathway_text TEXT,
  ADD COLUMN IF NOT EXISTS where_mn_does_this TEXT;

CREATE OR REPLACE FUNCTION public.cluster_id(_code TEXT)
RETURNS UUID LANGUAGE SQL STABLE SET search_path = public AS $$
  SELECT id FROM public.acte_clusters WHERE code = _code;
$$;

CREATE OR REPLACE FUNCTION public.subcluster_id(_code TEXT)
RETURNS UUID LANGUAGE SQL STABLE SET search_path = public AS $$
  SELECT id FROM public.acte_sub_clusters WHERE code = _code;
$$;