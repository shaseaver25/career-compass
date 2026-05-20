ALTER TABLE public.companies
  ADD COLUMN parent_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX idx_companies_parent_company_id ON public.companies(parent_company_id);

CREATE OR REPLACE FUNCTION public.companies_check_no_self_reference()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.parent_company_id IS NOT NULL AND NEW.parent_company_id = NEW.id THEN
    RAISE EXCEPTION 'Company cannot be its own parent';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_companies_no_self_reference
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.companies_check_no_self_reference();

INSERT INTO public.companies (slug, name, description, industry, mn_employees, source, status, parent_company_id)
SELECT s.slug, s.name, s.description, 'Public Service & Safety', s.mn_employees,
       'manual_editorial_seed', 'draft',
       (SELECT id FROM public.companies WHERE lower(name) = 'state of minnesota' LIMIT 1)
FROM (VALUES
  ('mn-it-services', 'Minnesota IT Services (MN.IT)', 'Central state IT organization. Builds and operates state government technology systems including MNsure, the unemployment-insurance system, the driver-license database, and cybersecurity for all state agencies. One of the largest CS/IT employers in Minnesota state government.', 1600),
  ('mn-bca', 'Minnesota Bureau of Criminal Apprehension (BCA)', 'State criminal investigation and forensic services agency. Operates labs in St. Paul and Bemidji, the state DNA database, digital forensics lab, and the criminal justice information system.', 500),
  ('mn-dot', 'Minnesota Department of Transportation (MnDOT)', 'State transportation agency. Plans, builds, and maintains state highways, bridges, public transit, and aviation. Major employer of engineers, GIS analysts, and field technicians statewide.', 5000),
  ('mn-deed', 'Minnesota Department of Employment and Economic Development (DEED)', 'State economic development agency. Operates the unemployment insurance system, workforce development programs, and the Labor Market Information research office that publishes the data used by this app.', 1500),
  ('mn-doe-agency', 'Minnesota Department of Education (MDE)', 'State agency overseeing K-12 public education. Administers the CTE (Career and Technical Education) framework whose Career Wheel anchors this app.', 400),
  ('mn-doh', 'Minnesota Department of Health', 'State public health agency. Oversees health regulations, public-health surveillance, vital records, and water-quality monitoring.', 1500),
  ('mn-dnr', 'Minnesota Department of Natural Resources (DNR)', 'State agency managing public lands, waters, fisheries, wildlife, forestry, and outdoor recreation. Largest seasonal employer in state government during summer.', 2500),
  ('mn-dor', 'Minnesota Department of Revenue', 'State tax administration agency. Processes individual and corporate tax returns, audits, and administers tax credits.', 1400),
  ('mn-dhs', 'Minnesota Department of Human Services (DHS)', 'State agency administering Medical Assistance, MFIP, child protection, and disability services. One of the largest state agencies by headcount.', 7000),
  ('mnsure', 'MNsure', 'Minnesota''s state-based health insurance marketplace. Built and operated by a team of software engineers, designers, and policy specialists working with MN.IT Services.', 200)
) AS s(slug, name, description, mn_employees)
WHERE NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.slug = s.slug);

INSERT INTO public.company_locations (company_id, city, state, is_primary)
SELECT c.id, hq.city, 'MN', true
FROM public.companies c
JOIN (VALUES
  ('mn-it-services', 'St. Paul'),
  ('mn-bca', 'St. Paul'),
  ('mn-dot', 'St. Paul'),
  ('mn-deed', 'St. Paul'),
  ('mn-doe-agency', 'Roseville'),
  ('mn-doh', 'St. Paul'),
  ('mn-dnr', 'St. Paul'),
  ('mn-dor', 'St. Paul'),
  ('mn-dhs', 'St. Paul'),
  ('mnsure', 'St. Paul')
) AS hq(slug, city) ON hq.slug = c.slug
WHERE c.source = 'manual_editorial_seed'
  AND NOT EXISTS (SELECT 1 FROM public.company_locations cl WHERE cl.company_id = c.id);

INSERT INTO public.companies (slug, name, description, industry, mn_employees, source, status, parent_company_id)
SELECT s.slug, s.name, s.description, 'Public Service & Safety', s.mn_employees,
       'manual_editorial_seed', 'draft',
       (SELECT id FROM public.companies WHERE lower(name) = 'u.s. federal government' LIMIT 1)
FROM (VALUES
  ('fbi-minneapolis', 'FBI Minneapolis Field Office', 'Federal Bureau of Investigation field office covering Minnesota, North Dakota, and South Dakota. Major employer of cybercrime, white-collar, and counterintelligence investigators.', 250),
  ('mpls-fed', 'Federal Reserve Bank of Minneapolis', 'One of 12 U.S. Federal Reserve regional banks. Conducts monetary policy research, supervises banks, and operates payment systems. Major employer of economists, data scientists, and software engineers in downtown Minneapolis.', 1250),
  ('ssa-mn', 'Social Security Administration — Minnesota offices', 'Federal agency administering Social Security and Disability programs through field offices across Minnesota.', 500),
  ('va-mn', 'U.S. Department of Veterans Affairs — Minnesota', 'Federal agency operating the Minneapolis VA Health Care System and outpatient clinics across MN. Major employer of physicians, nurses, mental-health clinicians, and IT staff.', 4500)
) AS s(slug, name, description, mn_employees)
WHERE NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.slug = s.slug);

INSERT INTO public.company_locations (company_id, city, state, is_primary)
SELECT c.id, hq.city, 'MN', true
FROM public.companies c
JOIN (VALUES
  ('fbi-minneapolis', 'Brooklyn Center'),
  ('mpls-fed', 'Minneapolis'),
  ('ssa-mn', 'Multiple'),
  ('va-mn', 'Minneapolis')
) AS hq(slug, city) ON hq.slug = c.slug
WHERE NOT EXISTS (SELECT 1 FROM public.company_locations cl WHERE cl.company_id = c.id);