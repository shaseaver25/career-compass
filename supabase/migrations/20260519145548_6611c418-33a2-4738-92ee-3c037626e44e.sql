DROP VIEW IF EXISTS public.v_careers_with_cluster;

-- (1) Add Human Services; rename Healthcare & Human Services -> Healthcare
INSERT INTO public.acte_clusters (grouping_id, code, name, slug, description, icon_name, display_order)
SELECT g.id, 'HUS', 'Human Services', 'human-services',
       'Behavioral and mental health, community and social services, personal care.',
       'ti-heart-handshake', 15
FROM public.acte_cluster_groupings g WHERE g.code = 'CC';

UPDATE public.acte_clusters
SET name = 'Healthcare', slug = 'healthcare',
    description = 'Biotechnology research and development, health data and administration, physical health.',
    icon_name = 'ti-stethoscope'
WHERE code = 'HHS';

UPDATE public.acte_clusters SET name = 'Entertainment, Art & Design', slug = 'entertainment-art-design' WHERE code = 'AED';
UPDATE public.acte_clusters SET name = 'Hospitality, Events & Tourism', slug = 'hospitality-events-tourism' WHERE code = 'HET';
UPDATE public.acte_clusters SET name = 'Public Service & Safety', slug = 'public-service-safety' WHERE code = 'PSS';
UPDATE public.acte_clusters SET name = 'Energy & Natural Resources', slug = 'energy-natural-resources' WHERE code = 'ENR';

ALTER TABLE public.acte_clusters ADD COLUMN IF NOT EXISTS is_cross_cutting BOOLEAN NOT NULL DEFAULT false;
UPDATE public.acte_clusters SET is_cross_cutting = true WHERE code = 'DTC';

UPDATE public.acte_clusters
SET grouping_id = (SELECT id FROM public.acte_cluster_groupings WHERE code = 'IF')
WHERE code IN ('DTC', 'MGT', 'MKS');
DELETE FROM public.acte_cluster_groupings WHERE code = 'CSS';

UPDATE public.acte_cluster_groupings SET color_hex = '#A23A3A', description = 'Hospitality, events, art, entertainment, and design — careers that shape what people experience.' WHERE code = 'CE';
UPDATE public.acte_cluster_groupings SET color_hex = '#6E4F99', description = 'Finance, management, marketing, and digital technology — careers that allocate capital and skills to fund future growth.' WHERE code = 'IF';
UPDATE public.acte_cluster_groupings SET color_hex = '#3F6B3F', description = 'Agriculture, energy, and natural resources — careers that steward land, food, and natural systems.' WHERE code = 'CR';
UPDATE public.acte_cluster_groupings SET color_hex = '#3A6E80', description = 'Education, healthcare, human services, public service and safety — careers that support community well-being.' WHERE code = 'CC';
UPDATE public.acte_cluster_groupings SET color_hex = '#B86E2C', description = 'Construction, advanced manufacturing, supply chain and transportation — careers that build infrastructure and move goods.' WHERE code = 'BM';

UPDATE public.acte_cluster_groupings SET display_order = 1 WHERE code = 'IF';
UPDATE public.acte_cluster_groupings SET display_order = 2 WHERE code = 'BM';
UPDATE public.acte_cluster_groupings SET display_order = 3 WHERE code = 'CC';
UPDATE public.acte_cluster_groupings SET display_order = 4 WHERE code = 'CR';
UPDATE public.acte_cluster_groupings SET display_order = 5 WHERE code = 'CE';

UPDATE public.acte_clusters SET display_order = 1  WHERE code = 'FIN';
UPDATE public.acte_clusters SET display_order = 2  WHERE code = 'MGT';
UPDATE public.acte_clusters SET display_order = 3  WHERE code = 'MKS';
UPDATE public.acte_clusters SET display_order = 4  WHERE code = 'DTC';
UPDATE public.acte_clusters SET display_order = 5  WHERE code = 'SCT';
UPDATE public.acte_clusters SET display_order = 6  WHERE code = 'AMF';
UPDATE public.acte_clusters SET display_order = 7  WHERE code = 'CON';
UPDATE public.acte_clusters SET display_order = 8  WHERE code = 'PSS';
UPDATE public.acte_clusters SET display_order = 9  WHERE code = 'HHS';
UPDATE public.acte_clusters SET display_order = 10 WHERE code = 'HUS';
UPDATE public.acte_clusters SET display_order = 11 WHERE code = 'EDU';
UPDATE public.acte_clusters SET display_order = 12 WHERE code = 'AGR';
UPDATE public.acte_clusters SET display_order = 13 WHERE code = 'ENR';
UPDATE public.acte_clusters SET display_order = 14 WHERE code = 'HET';
UPDATE public.acte_clusters SET display_order = 15 WHERE code = 'AED';

CREATE TABLE IF NOT EXISTS public.acte_sub_clusters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id    UUID NOT NULL REFERENCES public.acte_clusters(id) ON DELETE CASCADE,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.acte_sub_clusters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sub_clusters public read" ON public.acte_sub_clusters;
DROP POLICY IF EXISTS "sub_clusters admin write" ON public.acte_sub_clusters;
CREATE POLICY "sub_clusters public read" ON public.acte_sub_clusters FOR SELECT USING (true);
CREATE POLICY "sub_clusters admin write" ON public.acte_sub_clusters FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_acte_sub_clusters_cluster ON public.acte_sub_clusters(cluster_id);

INSERT INTO public.acte_sub_clusters (cluster_id, code, name, slug, display_order)
SELECT c.id, s.code, s.name, s.slug, s.display_order
FROM (VALUES
  ('AGR','AGR-ABZ','Agribusiness','agribusiness',1),
  ('AGR','AGR-ATA','Agricultural Technology & Automation','agricultural-technology-automation',2),
  ('AGR','AGR-ANS','Animal Systems','animal-systems',3),
  ('AGR','AGR-FSP','Food Science & Processing','food-science-processing',4),
  ('AGR','AGR-PLS','Plant Systems','plant-systems',5),
  ('AGR','AGR-WTS','Water Systems','water-systems',6),
  ('ENR','ENR-CAE','Clean & Alternative Energy','clean-alternative-energy',1),
  ('ENR','ENR-CLM','Conservation & Land Management','conservation-land-management',2),
  ('ENR','ENR-ERD','Ecological Research & Development','ecological-research-development',3),
  ('ENR','ENR-EVP','Environmental Protection','environmental-protection',4),
  ('ENR','ENR-RXT','Resource Extraction','resource-extraction',5),
  ('ENR','ENR-UTL','Utilities','utilities',6),
  ('HET','HET-ACC','Accommodations','accommodations',1),
  ('HET','HET-CEV','Conferences & Events','conferences-events',2),
  ('HET','HET-CFS','Culinary and Food Services','culinary-food-services',3),
  ('HET','HET-TVL','Travel & Leisure','travel-leisure',4),
  ('AED','AED-DDA','Design & Digital Arts','design-digital-arts',1),
  ('AED','AED-FAI','Fashion & Interiors','fashion-interiors',2),
  ('AED','AED-LST','Lighting & Sound Technology','lighting-sound-technology',3),
  ('AED','AED-MPB','Media Production & Broadcasting','media-production-broadcasting',4),
  ('FIN','FIN-ACC','Accounting','accounting',1),
  ('FIN','FIN-BNC','Banking & Credit','banking-credit',2),
  ('FIN','FIN-FSI','Financial Strategy & Investments','financial-strategy-investments',3),
  ('FIN','FIN-INS','Insurance','insurance',4),
  ('FIN','FIN-RES','Real Estate','real-estate',5),
  ('MGT','MGT-BIM','Business Information Management','business-information-management',1),
  ('MGT','MGT-ESB','Entrepreneurship & Small Business','entrepreneurship-small-business',2),
  ('MGT','MGT-LOP','Leadership & Operations','leadership-operations',3),
  ('MGT','MGT-PJM','Project Management','project-management',4),
  ('MGT','MGT-REG','Regulation','regulation',5),
  ('MKS','MKS-MAE','Market Research, Analytics & Ethics','market-research-analytics-ethics',1),
  ('MKS','MKS-MAD','Marketing & Advertising','marketing-advertising',2),
  ('MKS','MKS-RCE','Retail & Customer Experience','retail-customer-experience',3),
  ('MKS','MKS-STS','Strategic Sales','strategic-sales',4),
  ('DTC','DTC-DSA','Data Science & AI','data-science-ai',1),
  ('DTC','DTC-ITS','IT Support & Services','it-support-services',2),
  ('DTC','DTC-NSC','Network Systems & Cybersecurity','network-systems-cybersecurity',3),
  ('DTC','DTC-SWS','Software Solutions','software-solutions',4),
  ('DTC','DTC-WCL','Web and Cloud','web-cloud',5),
  ('DTC','DTC-UVT','Uncrewed Vehicle Technology','uncrewed-vehicle-technology',6),
  ('SCT','SCT-AST','Air & Space Transportation','air-space-transportation',1),
  ('SCT','SCT-GRT','Ground & Rail Transportation','ground-rail-transportation',2),
  ('SCT','SCT-MNR','Maintenance & Repair','maintenance-repair',3),
  ('SCT','SCT-MTR','Marine Transportation','marine-transportation',4),
  ('SCT','SCT-PLG','Planning & Logistics','planning-logistics',5),
  ('SCT','SCT-PWH','Purchasing & Warehousing','purchasing-warehousing',6),
  ('AMF','AMF-ENG','Engineering','engineering',1),
  ('AMF','AMF-INM','Industrial Machinery','industrial-machinery',2),
  ('AMF','AMF-PAU','Production & Automation','production-automation',3),
  ('AMF','AMF-ROB','Robotics','robotics',4),
  ('AMF','AMF-SQA','Safety & Quality Assurance','safety-quality-assurance',5),
  ('CON','CON-ACE','Architecture & Civil Engineering','architecture-civil-engineering',1),
  ('CON','CON-EOM','Equipment Operation & Maintenance','equipment-operation-maintenance',2),
  ('CON','CON-SKT','Skilled Trades','skilled-trades',3),
  ('CON','CON-CPD','Construction Planning & Development','construction-planning-development',4),
  ('PSS','PSS-EMR','Emergency Response','emergency-response',1),
  ('PSS','PSS-MNS','Military & National Security','military-national-security',2),
  ('PSS','PSS-PSF','Public Safety','public-safety',3),
  ('PSS','PSS-JUD','Judicial Systems','judicial-systems',4),
  ('PSS','PSS-LSF','Local, State & Federal Services','local-state-federal-services',5),
  ('HHS','HHS-BRD','Biotechnology Research & Development','biotechnology-research-development',1),
  ('HHS','HHS-HDA','Health Data & Administration','health-data-administration',2),
  ('HHS','HHS-PHY','Physical Health','physical-health',3),
  ('HUS','HUS-BMH','Behavioral & Mental Health','behavioral-mental-health',1),
  ('HUS','HUS-CSS','Community & Social Services','community-social-services',2),
  ('HUS','HUS-PCS','Personal Care Services','personal-care-services',3),
  ('EDU','EDU-ECD','Early Childhood Development','early-childhood-development',1),
  ('EDU','EDU-LSC','Learner Support & Community Engagement','learner-support-community-engagement',2),
  ('EDU','EDU-TTF','Teaching, Training & Facilitation','teaching-training-facilitation',3),
  ('EDU','EDU-EAL','Education Administration & Leadership','education-administration-leadership',4)
) AS s(cluster_code, code, name, slug, display_order)
JOIN public.acte_clusters c ON c.code = s.cluster_code
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.careers
  ADD COLUMN IF NOT EXISTS primary_sub_cluster_id UUID REFERENCES public.acte_sub_clusters(id);
CREATE INDEX IF NOT EXISTS idx_careers_primary_sub_cluster ON public.careers(primary_sub_cluster_id);

CREATE TABLE IF NOT EXISTS public.career_sub_cluster_tags (
  career_id     UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  sub_cluster_id UUID NOT NULL REFERENCES public.acte_sub_clusters(id) ON DELETE CASCADE,
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (career_id, sub_cluster_id)
);
ALTER TABLE public.career_sub_cluster_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "career_sub_cluster_tags public read" ON public.career_sub_cluster_tags;
DROP POLICY IF EXISTS "career_sub_cluster_tags admin write" ON public.career_sub_cluster_tags;
CREATE POLICY "career_sub_cluster_tags public read" ON public.career_sub_cluster_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.careers c WHERE c.id = career_id AND (c.status = 'published' OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "career_sub_cluster_tags admin write" ON public.career_sub_cluster_tags FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_career_sub_cluster_tags_one_primary
  ON public.career_sub_cluster_tags(career_id) WHERE is_primary = true;

CREATE VIEW public.v_careers_with_cluster AS
SELECT
  c.*,
  ac.code  AS cluster_code,
  ac.name  AS cluster_name,
  ac.slug  AS cluster_slug,
  ac.is_cross_cutting AS cluster_is_cross_cutting,
  acg.code AS field_code,
  acg.name AS field_name,
  acg.color_hex AS field_color,
  sc.code  AS sub_cluster_code,
  sc.name  AS sub_cluster_name,
  sc.slug  AS sub_cluster_slug
FROM public.careers c
LEFT JOIN public.acte_clusters ac          ON ac.id  = c.primary_cluster_id
LEFT JOIN public.acte_cluster_groupings acg ON acg.id = ac.grouping_id
LEFT JOIN public.acte_sub_clusters sc      ON sc.id  = c.primary_sub_cluster_id;

ALTER VIEW public.v_careers_with_cluster SET (security_invoker = true);