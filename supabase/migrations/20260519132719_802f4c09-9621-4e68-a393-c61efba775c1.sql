-- ACTE Cluster Groupings (outer ring)
CREATE TABLE public.acte_cluster_groupings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  description      TEXT,
  is_cross_cutting BOOLEAN NOT NULL DEFAULT false,
  display_order    INTEGER NOT NULL,
  color_hex        TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.acte_cluster_groupings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groupings public read"  ON public.acte_cluster_groupings FOR SELECT USING (true);
CREATE POLICY "groupings admin write"  ON public.acte_cluster_groupings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.acte_cluster_groupings (code, name, description, is_cross_cutting, display_order, color_hex) VALUES
  ('BM',  'Building & Moving',           'Constructing the physical infrastructure and moving goods that power the economy.', false, 1, '#C16A4D'),
  ('CC',  'Caring for Communities',      'Supporting human well-being through health, education, and public service.',       false, 2, '#4F7C7E'),
  ('CE',  'Creating & Experiencing',     'Designing experiences, art, hospitality, and the cultural fabric.',                 false, 3, '#A87844'),
  ('CR',  'Cultivating Resources',       'Stewarding land, food, energy, and natural systems.',                               false, 4, '#6B8C4C'),
  ('IF',  'Investing in the Future',     'Allocating capital and financial systems that fund growth.',                        false, 5, '#5C6AA0'),
  ('CSS', 'Connecting & Supporting Success', 'Cross-cutting clusters whose skills and careers intersect with every other cluster.', true,  6, '#7E4E80');

-- ACTE Clusters (inner ring)
CREATE TABLE public.acte_clusters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grouping_id    UUID NOT NULL REFERENCES public.acte_cluster_groupings(id),
  code           TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  description    TEXT NOT NULL,
  icon_name      TEXT,
  display_order  INTEGER NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.acte_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clusters public read"  ON public.acte_clusters FOR SELECT USING (true);
CREATE POLICY "clusters admin write"  ON public.acte_clusters FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_acte_clusters_grouping ON public.acte_clusters(grouping_id);

INSERT INTO public.acte_clusters (grouping_id, code, name, slug, description, icon_name, display_order)
SELECT g.id, c.code, c.name, c.slug, c.description, c.icon_name, c.display_order
FROM (VALUES
  ('BM',  'AMF',  'Advanced Manufacturing',           'advanced-manufacturing',     'Designing, building, and operating modern production systems.',                            'ti-tool',           1),
  ('BM',  'CON',  'Construction',                     'construction',               'Building and maintaining homes, commercial buildings, roads, bridges, and utilities.',     'ti-hammer',         2),
  ('BM',  'SCT',  'Supply Chain & Transportation',    'supply-chain',               'Moving goods, materials, and people — logistics, warehousing, transit, aviation.',         'ti-truck',          3),
  ('CC',  'EDU',  'Education',                        'education',                  'Teaching, training, instructional design, learning research, and academic support.',       'ti-school',         4),
  ('CC',  'HHS',  'Healthcare & Human Services',      'healthcare-human-services',  'Medicine, nursing, therapy, public health, social work, and human service careers.',      'ti-heartbeat',      5),
  ('CC',  'PSS',  'Public Service & Safety',          'public-service-safety',      'Government, law, corrections, emergency response, military, and civic administration.',   'ti-shield-check',   6),
  ('CE',  'AED',  'Arts, Entertainment & Design',     'arts-entertainment-design',  'Visual arts, performing arts, media production, journalism, fashion, architecture.',     'ti-palette',        7),
  ('CE',  'HET',  'Hospitality, Events & Tourism',    'hospitality-events-tourism', 'Lodging, food service, travel, event planning, recreation, and tourism experiences.',    'ti-building-store', 8),
  ('CR',  'AGR',  'Agriculture',                      'agriculture',                'Farming, ranching, food production, agribusiness, agricultural science.',                 'ti-plant',          9),
  ('CR',  'ENR',  'Energy & Natural Resources',       'energy-natural-resources',   'Power generation, renewables, water, mining, forestry, and environmental stewardship.',  'ti-flame',         10),
  ('IF',  'FIN',  'Financial Services',               'financial-services',         'Banking, investment, insurance, accounting, and capital markets.',                         'ti-coins',         11),
  ('CSS', 'DTC',  'Digital Technology',               'digital-technology',         'Software engineering, AI/ML, data, cybersecurity, cloud, devops. Cross-cuts every industry. Primary home for CS/AI careers.', 'ti-cpu',  12),
  ('CSS', 'MGT',  'Management & Entrepreneurship',    'management-entrepreneurship','Leadership, operations, project management, and starting/scaling ventures across industries.','ti-briefcase',    13),
  ('CSS', 'MKS',  'Marketing & Sales',                'marketing-sales',            'Promoting, branding, and selling across industries.',                                      'ti-speakerphone',  14)
) AS c(grouping_code, code, name, slug, description, icon_name, display_order)
JOIN public.acte_cluster_groupings g ON g.code = c.grouping_code;

-- Career → Cluster M2M
CREATE TABLE public.career_cluster_tags (
  career_id  UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  cluster_id UUID NOT NULL REFERENCES public.acte_clusters(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (career_id, cluster_id)
);
ALTER TABLE public.career_cluster_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cluster_tags public read" ON public.career_cluster_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.careers c WHERE c.id = career_id AND (c.status = 'published' OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "cluster_tags admin write" ON public.career_cluster_tags FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_career_cluster_tags_cluster ON public.career_cluster_tags(cluster_id);
CREATE UNIQUE INDEX idx_career_cluster_tags_one_primary ON public.career_cluster_tags(career_id) WHERE is_primary = true;

-- CS/AI tech_tags on careers
ALTER TABLE public.careers ADD COLUMN tech_tags TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX idx_careers_tech_tags ON public.careers USING GIN (tech_tags);

-- MN Perkins V Secondary Consortia (23 regions)
CREATE TABLE public.mn_perkins_consortia (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  anchor_college  TEXT NOT NULL,
  region_label    TEXT NOT NULL,
  is_metro        BOOLEAN NOT NULL DEFAULT false,
  display_order   INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mn_perkins_consortia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consortia public read" ON public.mn_perkins_consortia FOR SELECT USING (true);
CREATE POLICY "consortia admin write" ON public.mn_perkins_consortia FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.mn_perkins_consortia (code, name, anchor_college, region_label, is_metro, display_order) VALUES
  ('central_lakes',    'Central Lakes',                       'Central Lakes College',                            'Central MN',             false, 1),
  ('dakota_county',    'Dakota County',                       'Dakota County Technical College',                  'Twin Cities Metro',      true,  2),
  ('great_river',      'Great River',                         'St. Cloud Technical & Community College',          'Central MN',             false, 3),
  ('hennepin_west',    'Hennepin West',                       'Hennepin Technical / North Hennepin CC',           'Twin Cities Metro',      true,  4),
  ('lake_superior',    'Lake Superior',                       'Lake Superior College',                            'Northeast MN',           false, 5),
  ('lakes_country',    'Lakes Country',                       'Minnesota State Community and Technical College',  'Northwest MN',           false, 6),
  ('mid_minnesota',    'Mid Minnesota',                       'Ridgewater College',                               'West Central MN',        false, 7),
  ('minneapolis',      'Minneapolis',                         'Minneapolis College',                              'Twin Cities Metro',      true,  8),
  ('minnesota_west',   'Minnesota West',                      'Minnesota West Community and Technical College',  'Southwest MN',           false, 9),
  ('north_country',    'North Country / Northwest',           'Northwest Technical College',                      'North Central MN',       false, 10),
  ('northeast_metro',  'Northeast Metro',                     'Century College',                                  'Twin Cities Metro',      true,  11),
  ('oak_land',         'Oak Land',                            'Anoka-Ramsey CC / Anoka Technical College',        'Twin Cities Metro',      true,  12),
  ('pine_technical',   'Pine Technical',                      'Pine Technical and Community College',             'East Central MN',        false, 13),
  ('pine_to_prairie',  'Pine to Prairie / Northland',         'Northland Community and Technical College',        'Northwest MN',           false, 14),
  ('riverland',        'Riverland',                           'Riverland Community College',                      'Southeast MN',           false, 15),
  ('rochester_zed',    'Rochester / Zumbro Education District','Rochester Community and Technical College',       'Southeast MN',           false, 16),
  ('runestone',        'Runestone',                           'Alexandria Technical and Community College',       'West Central MN',        false, 17),
  ('saint_paul',       'Saint Paul',                          'Saint Paul College',                               'Twin Cities Metro',      true,  18),
  ('south_central',    'South Central',                       'South Central College',                            'South Central MN',       false, 19),
  ('south_metro',      'South Metro',                         'Inver Hills Community College',                    'Twin Cities Metro',      true,  20),
  ('southeast',        'Southeast',                           'Minnesota State College Southeast',                'Southeast MN',           false, 21),
  ('southwest_metro',  'Southwest Metro',                     'Normandale Community College',                     'Twin Cities Metro',      true,  22),
  ('true_north_stars', 'True North Stars',                    'Minnesota North College',                          'Iron Range / Arrowhead', false, 23);

-- Wire FKs onto existing tables
ALTER TABLE public.company_locations
  ADD COLUMN consortium_id UUID REFERENCES public.mn_perkins_consortia(id),
  ADD COLUMN latitude  DECIMAL(9,6),
  ADD COLUMN longitude DECIMAL(9,6);
CREATE INDEX idx_company_locations_consortium ON public.company_locations(consortium_id);

ALTER TABLE public.careers
  ADD COLUMN primary_cluster_id UUID REFERENCES public.acte_clusters(id);
CREATE INDEX idx_careers_primary_cluster ON public.careers(primary_cluster_id);

-- Convenience view
CREATE OR REPLACE VIEW public.v_careers_with_cluster AS
SELECT c.*, ac.code AS cluster_code, ac.name AS cluster_name, ac.slug AS cluster_slug,
       acg.code AS grouping_code, acg.name AS grouping_name, acg.is_cross_cutting,
       acg.color_hex AS grouping_color
FROM public.careers c
LEFT JOIN public.acte_clusters ac          ON ac.id  = c.primary_cluster_id
LEFT JOIN public.acte_cluster_groupings acg ON acg.id = ac.grouping_id;