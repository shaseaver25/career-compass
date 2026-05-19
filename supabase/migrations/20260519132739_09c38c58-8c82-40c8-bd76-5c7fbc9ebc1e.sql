DROP VIEW IF EXISTS public.v_careers_with_cluster;
CREATE VIEW public.v_careers_with_cluster
WITH (security_invoker = true) AS
SELECT c.*, ac.code AS cluster_code, ac.name AS cluster_name, ac.slug AS cluster_slug,
       acg.code AS grouping_code, acg.name AS grouping_name, acg.is_cross_cutting,
       acg.color_hex AS grouping_color
FROM public.careers c
LEFT JOIN public.acte_clusters ac          ON ac.id  = c.primary_cluster_id
LEFT JOIN public.acte_cluster_groupings acg ON acg.id = ac.grouping_id;