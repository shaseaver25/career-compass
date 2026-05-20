
-- Assign primary_cluster_id to existing published careers by industry mapping
UPDATE public.careers SET primary_cluster_id = (SELECT id FROM public.acte_clusters WHERE slug = 'healthcare')
  WHERE primary_cluster_id IS NULL AND industry = 'Healthcare';

UPDATE public.careers SET primary_cluster_id = (SELECT id FROM public.acte_clusters WHERE slug = 'advanced-manufacturing')
  WHERE primary_cluster_id IS NULL AND industry = 'Manufacturing';

UPDATE public.careers SET primary_cluster_id = (SELECT id FROM public.acte_clusters WHERE slug = 'construction')
  WHERE primary_cluster_id IS NULL AND industry = 'Construction';

UPDATE public.careers SET primary_cluster_id = (SELECT id FROM public.acte_clusters WHERE slug = 'digital-technology')
  WHERE primary_cluster_id IS NULL AND industry = 'Information Technology';
