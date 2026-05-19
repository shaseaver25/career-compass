import { supabase } from "@/integrations/supabase/client";

export async function fetchPublishedCareers() {
  const { data, error } = await supabase
    .from("careers")
    .select("id, slug, title, short_description, median_salary, growth_outlook, industry, education_level, skills, featured")
    .eq("status", "published")
    .order("title");
  if (error) throw error;
  return data ?? [];
}

export async function fetchPublishedCareersByCluster(clusterSlug: string) {
  const { data: cluster, error: cErr } = await supabase
    .from("acte_clusters")
    .select("id")
    .eq("slug", clusterSlug)
    .maybeSingle();
  if (cErr) throw cErr;
  if (!cluster) return { careers: [], unknownCluster: true as const };

  const { data: tagRows, error: tErr } = await supabase
    .from("career_cluster_tags")
    .select("career_id")
    .eq("cluster_id", cluster.id);
  if (tErr) throw tErr;
  const taggedIds = (tagRows ?? []).map((r: any) => r.career_id as string);

  let query = supabase
    .from("careers")
    .select("id, slug, title, short_description, median_salary, growth_outlook, industry, education_level, skills, featured, primary_cluster_id")
    .eq("status", "published");

  if (taggedIds.length > 0) {
    query = query.or(`primary_cluster_id.eq.${cluster.id},id.in.(${taggedIds.join(",")})`);
  } else {
    query = query.eq("primary_cluster_id", cluster.id);
  }
  const { data, error } = await query.order("title");
  if (error) throw error;
  return { careers: data ?? [], unknownCluster: false as const };
}

export async function fetchPublishedCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select("id, slug, name, description, industry, logo_emoji, logo_url, company_locations(city, state, is_primary), company_careers(career_id)")
    .eq("status", "published")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((c: any) => {
    const loc = c.company_locations?.find((l: any) => l.is_primary) ?? c.company_locations?.[0];
    return { ...c, city: loc?.city ?? null, state: loc?.state ?? null, careers_count: c.company_careers?.length ?? 0 };
  });
}

export async function fetchCareerBySlug(slug: string) {
  const { data: career, error } = await supabase.from("careers").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw error;
  if (!career) return null;
  const [{ data: steps }, { data: links }, { data: interviews }] = await Promise.all([
    supabase.from("pathway_steps").select("*").eq("career_id", career.id).order("step_order"),
    supabase.from("company_careers").select("companies(id, slug, name, industry, logo_emoji, logo_url, description, status, company_locations(city, state, is_primary))").eq("career_id", career.id),
    supabase.from("interviews").select("id, interviewee_name, interviewee_role, audio_url, companies(slug, name), interview_answers(answer, interview_questions(question_order, prompt, short_label))").eq("career_id", career.id).eq("status", "published"),
  ]);
  const companies = (links ?? []).map((l: any) => l.companies).filter((c: any) => c && c.status === "published").map((c: any) => {
    const loc = c.company_locations?.find((l: any) => l.is_primary) ?? c.company_locations?.[0];
    return { ...c, city: loc?.city ?? null, state: loc?.state ?? null };
  });
  return { career, steps: steps ?? [], companies, interviews: interviews ?? [] };
}

export async function fetchCompanyBySlug(slug: string) {
  const { data: company, error } = await supabase.from("companies").select("*, company_locations(*)").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw error;
  if (!company) return null;
  const [{ data: videos }, { data: links }, { data: interviews }] = await Promise.all([
    supabase.from("videos").select("*").eq("company_id", company.id),
    supabase.from("company_careers").select("careers(id, slug, title, short_description, median_salary, growth_outlook, industry, status)").eq("company_id", company.id),
    supabase.from("interviews").select("id, interviewee_name, interviewee_role, audio_url, careers(slug, title), interview_answers(answer, interview_questions(question_order, prompt, short_label))").eq("company_id", company.id).eq("status", "published"),
  ]);
  const careers = (links ?? []).map((l: any) => l.careers).filter((c: any) => c && c.status === "published");
  return { company, videos: videos ?? [], careers, interviews: interviews ?? [] };
}
