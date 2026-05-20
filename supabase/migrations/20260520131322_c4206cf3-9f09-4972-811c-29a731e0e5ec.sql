
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS mn_employees INTEGER,
  ADD COLUMN IF NOT EXISTS deed_rank INTEGER,
  ADD COLUMN IF NOT EXISTS source TEXT;
CREATE INDEX IF NOT EXISTS idx_companies_deed_rank ON public.companies(deed_rank) WHERE deed_rank IS NOT NULL;

CREATE TABLE public.deed_employers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank                  INTEGER NOT NULL,
  organization          TEXT NOT NULL UNIQUE,
  mn_employees          INTEGER NOT NULL,
  business_description  TEXT,
  matched_company_id    UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  suggested_cluster_id  UUID REFERENCES public.acte_clusters(id),
  source_url            TEXT NOT NULL DEFAULT 'https://mn.gov/deed/assets/top-companies-employers_tcm1045-647715.xlsx',
  source_last_modified  TIMESTAMPTZ,
  first_seen_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_from_source   BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deed_employers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deed_employers admin all" ON public.deed_employers FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "deed_employers public read" ON public.deed_employers FOR SELECT USING (true);
CREATE TRIGGER trg_deed_employers_updated BEFORE UPDATE ON public.deed_employers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.deed_sync_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_file_hash      TEXT,
  source_last_modified  TIMESTAMPTZ,
  rows_added            INTEGER NOT NULL DEFAULT 0,
  rows_updated          INTEGER NOT NULL DEFAULT 0,
  rows_removed          INTEGER NOT NULL DEFAULT 0,
  rows_unchanged        INTEGER NOT NULL DEFAULT 0,
  status                TEXT NOT NULL,
  error_message         TEXT,
  triggered_by          TEXT NOT NULL,
  duration_ms           INTEGER
);
ALTER TABLE public.deed_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deed_sync_log admin read" ON public.deed_sync_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "deed_sync_log service insert" ON public.deed_sync_log FOR INSERT
  WITH CHECK (true);

INSERT INTO public.deed_employers (rank, organization, mn_employees, business_description, source_last_modified) VALUES
  (1,'Mayo Clinic',50035,'Medical care, research and education.','2026-03-17'),
  (2,'State of Minnesota',41344,'State government.','2026-03-17'),
  (3,'Target Corp.',35000,'General merchandise retailer in stores and online.','2026-03-17'),
  (4,'Fairview Health Services',33094,'Integrated academic health system that includes clinics, hospitals, etc.','2026-03-17'),
  (5,'U.S. Federal Government',32897,'Federal government.','2026-03-17'),
  (6,'Allina Health',29234,'Not-for-profit health care system that includes clinics, hospitals, pharmacies, etc.','2026-03-17'),
  (7,'University of Minnesota',28130,'Minnesota''s largest higher education institution.','2026-03-17'),
  (8,'HealthPartners Inc.',26000,'Health care provider, health insurance.','2026-03-17'),
  (9,'Walmart Inc.',24777,'Merchandise and grocery retailer.','2026-03-17'),
  (10,'UnitedHealth Group Inc.',18400,'Health care, information and technology-enabled health services.','2026-03-17'),
  (11,'Minnesota State',14567,'33 Minnesota State colleges and universities with 54 campuses offering education in 47 communities.','2026-03-17'),
  (12,'Essentia Health',12126,'Integrated health system serving patients in Minnesota, Wisconsin and North Dakota.','2026-03-17'),
  (13,'U.S. Bancorp',11865,'Multistate bank holding company, diversified financial services.','2026-03-17'),
  (14,'U.S. Postal Service',11591,'Federal government agency responsible for providing postal service in the United States.','2026-03-17'),
  (15,'CentraCare Health',11473,'Central Minnesota health care system.','2026-03-17'),
  (16,'Wells Fargo & Co.',11000,'Banking, investment and mortgage products and services.','2026-03-17'),
  (17,'Medtronic',10259,'Manufacturer of products for cardiac and vascular diseases, restorative therapies, and minimally invasive therapies.','2026-03-17'),
  (18,'Hennepin County',9971,'County government.','2026-03-17'),
  (19,'Amazon.com Inc.',9500,'E-commerce, technology and logistics company.','2026-03-17'),
  (20,'3M Co.',9196,'A science-based company that provides products and solutions for industrial, healthcare, consumer, and other markets.','2026-03-17'),
  (21,'Hormel Foods Corp.',8113,'A global, branded food company.','2026-03-17'),
  (22,'Presbyterian Homes & Services',7976,'Nonprofit, faith-based senior housing and services provider.','2026-03-17'),
  (23,'Hennepin Healthcare',7725,'Health care system, including an acute care Level 1 Adult and Pediatric Trauma Center.','2026-03-17'),
  (24,'North Memorial Health',6759,'Nonprofit health care system, including two hospitals and clinics.','2026-03-17'),
  (25,'Children''s Minnesota',5886,'Pediatric health system, including hospitals, primary and specialty clinics.','2026-03-17'),
  (26,'Life Time Group Holdings Inc.',5615,'Operator of sports, wellness, family-recreation resorts and athletic clubs.','2026-03-17'),
  (27,'Andersen Corp.',5000,'Window and door products manufacturer and marketer.','2026-03-17'),
  (28,'Metropolitan Council',4700,'Regional planning agency operating regional wastewater, transit and parks services.','2026-03-17'),
  (29,'Xcel Energy Inc.',4661,'Electric and natural gas utility operations serving customers across multiple states.','2026-03-17'),
  (30,'Cassia',4658,'Housing, health care and community-based services provider.','2026-03-17'),
  (31,'University of Minnesota Physicians',4603,'Multispecialty academic physician practice established at the University of Minnesota.','2026-03-17'),
  (32,'Ebenezer Senior Living',4542,'Independent living, assisted living, memory care and skilled care provider.','2026-03-17'),
  (33,'Thomson Reuters',4500,'Provider of news and information-based tools to professionals.','2026-03-17'),
  (34,'City of Minneapolis',4338,'City government.','2026-03-17'),
  (35,'Ameriprise Financial Inc.',4328,'Diversified financial-services firm.','2026-03-17'),
  (36,'General Mills Inc.',3900,'Manufacturer of food products to the retail, food-service and bakery industries.','2026-03-17'),
  (37,'Ramsey County',3792,'County government.','2026-03-17'),
  (38,'Benedictine',3784,'Catholic, nonprofit, long-term care health system and housing.','2026-03-17'),
  (39,'DigiKey',3774,'Online distributor of electronic components, automation products.','2026-03-17'),
  (40,'Lund Food Holdings Inc.',3750,'Grocery retailer with 29 stores in metro area.','2026-03-17'),
  (41,'APi Group Corp.',3692,'Global business services provider of fire and life safety, security and specialty services.','2026-03-17'),
  (42,'Shakopee Mdewakanton Sioux Community',3581,'A federally recognized, sovereign Indian tribe committed to charitable giving and economic development.','2026-03-17'),
  (43,'Taylor Corp.',3500,'Graphic communications company that manufactures labels, packaging and printed materials.','2026-03-17'),
  (44,'Emerson Electric Co.',3300,'Network power, process management, industrial automation, climate technologies and commercial and residential solutions.','2026-03-17'),
  (45,'Sun Country Airlines Holdings Inc.',3211,'Low-cost passenger and cargo airline.','2026-03-17'),
  (46,'City of St. Paul',3094,'City government.','2026-03-17'),
  (47,'Polaris Inc.',3000,'Designs, engineers and manufactures snowmobiles, off-road vehicles and motorcycles.','2026-03-17'),
  (48,'Ecolab Inc.',2900,'Water, hygiene and infection prevention company.','2026-03-17'),
  (49,'Jerry''s Enterprises Inc.',2800,'Owner of several Cub Foods, Cub Liquor, Jerry''s Foods, Country Markets and other retail businesses.','2026-03-17'),
  (50,'Blue Cross and Blue Shield of Minnesota',2618,'Health-plan organization in Minnesota covering more than 2.5 million members.','2026-03-17'),
  (51,'RBC US',2400,'Asset and wealth management firm.','2026-03-17'),
  (52,'Marsden Holding',2301,'Janitorial, mechanical maintenance, window cleaning, carpet cleaning, and pest control services.','2026-03-17'),
  (53,'Marvin',2300,'Manufacturer of wood, clad-wood, aluminum and fiberglass windows and doors.','2026-03-17'),
  (54,'The Travelers Cos. Inc.',2278,'Property casualty insurance for auto, home and business.','2026-03-17'),
  (55,'St. Louis County',2258,'County government.','2026-03-17'),
  (56,'Ridgeview',2130,'Regional health care system serving a seven-county area in the western Twin Cities metro.','2026-03-17'),
  (57,'Securian Financial Group Inc.',2113,'Financial services, including insurance, investment and retirement.','2026-03-17'),
  (58,'Hunt Electric Corp.',2603,'National electrical design, build and maintenance firm.','2026-03-17'),
  (59,'Prime Therapeutics',2000,'Diversified pharmacy solutions organization serving health plans, employers, and government programs.','2026-03-17'),
  (60,'Allianz Life Insurance Co. of North America',1952,'Provider of retirement risk protection products such as annuities and life insurance.','2026-03-17');

UPDATE public.deed_employers SET suggested_cluster_id = (SELECT id FROM public.acte_clusters WHERE code='HHS')
WHERE organization IN ('Mayo Clinic','Fairview Health Services','Allina Health','HealthPartners Inc.','UnitedHealth Group Inc.','Essentia Health','CentraCare Health','Hennepin Healthcare','North Memorial Health','Children''s Minnesota','University of Minnesota Physicians','Ridgeview','Prime Therapeutics');

UPDATE public.deed_employers SET suggested_cluster_id = (SELECT id FROM public.acte_clusters WHERE code='PSS')
WHERE organization IN ('State of Minnesota','U.S. Federal Government','U.S. Postal Service','Hennepin County','Metropolitan Council','Shakopee Mdewakanton Sioux Community','City of Minneapolis','Ramsey County','City of St. Paul','St. Louis County','APi Group Corp.');

UPDATE public.deed_employers SET suggested_cluster_id = (SELECT id FROM public.acte_clusters WHERE code='MKS')
WHERE organization IN ('Target Corp.','Walmart Inc.','Lund Food Holdings Inc.','Jerry''s Enterprises Inc.','Taylor Corp.');

UPDATE public.deed_employers SET suggested_cluster_id = (SELECT id FROM public.acte_clusters WHERE code='EDU')
WHERE organization IN ('University of Minnesota','Minnesota State');

UPDATE public.deed_employers SET suggested_cluster_id = (SELECT id FROM public.acte_clusters WHERE code='FIN')
WHERE organization IN ('U.S. Bancorp','Wells Fargo & Co.','Ameriprise Financial Inc.','Blue Cross and Blue Shield of Minnesota','RBC US','Securian Financial Group Inc.','The Travelers Cos. Inc.','Allianz Life Insurance Co. of North America');

UPDATE public.deed_employers SET suggested_cluster_id = (SELECT id FROM public.acte_clusters WHERE code='AMF')
WHERE organization IN ('Medtronic','3M Co.','Emerson Electric Co.','Polaris Inc.');

UPDATE public.deed_employers SET suggested_cluster_id = (SELECT id FROM public.acte_clusters WHERE code='DTC')
WHERE organization IN ('Amazon.com Inc.','Thomson Reuters','DigiKey');

UPDATE public.deed_employers SET suggested_cluster_id = (SELECT id FROM public.acte_clusters WHERE code='AGR')
WHERE organization IN ('Hormel Foods Corp.','General Mills Inc.');

UPDATE public.deed_employers SET suggested_cluster_id = (SELECT id FROM public.acte_clusters WHERE code='HUS')
WHERE organization IN ('Presbyterian Homes & Services','Cassia','Ebenezer Senior Living','Benedictine');

UPDATE public.deed_employers SET suggested_cluster_id = (SELECT id FROM public.acte_clusters WHERE code='HET')
WHERE organization IN ('Life Time Group Holdings Inc.','Sun Country Airlines Holdings Inc.');

UPDATE public.deed_employers SET suggested_cluster_id = (SELECT id FROM public.acte_clusters WHERE code='CON')
WHERE organization IN ('Andersen Corp.','Marvin','Hunt Electric Corp.','Marsden Holding');

UPDATE public.deed_employers SET suggested_cluster_id = (SELECT id FROM public.acte_clusters WHERE code='ENR')
WHERE organization IN ('Xcel Energy Inc.','Ecolab Inc.');

INSERT INTO public.companies (slug, name, description, industry, mn_employees, deed_rank, source, status)
SELECT
  lower(regexp_replace(regexp_replace(de.organization, '[^a-zA-Z0-9 ]', '', 'g'), '\s+', '-', 'g')),
  de.organization,
  de.business_description,
  ac.name,
  de.mn_employees,
  de.rank,
  'deed_top_employers_2026_03',
  'draft'
FROM public.deed_employers de
LEFT JOIN public.acte_clusters ac ON ac.id = de.suggested_cluster_id
WHERE NOT EXISTS (SELECT 1 FROM public.companies c WHERE lower(c.name) = lower(de.organization));

UPDATE public.deed_employers de
SET matched_company_id = c.id
FROM public.companies c
WHERE lower(c.name) = lower(de.organization)
  AND de.matched_company_id IS NULL;

INSERT INTO public.company_locations (company_id, city, state, is_primary)
SELECT c.id, 'Multiple', 'MN', true
FROM public.companies c
WHERE c.source = 'deed_top_employers_2026_03'
  AND NOT EXISTS (SELECT 1 FROM public.company_locations cl WHERE cl.company_id = c.id);

INSERT INTO public.deed_sync_log (status, rows_added, rows_updated, rows_removed, rows_unchanged, triggered_by, source_last_modified)
VALUES ('success', 60, 0, 0, 0, 'manual:initial_seed', '2026-03-17');
