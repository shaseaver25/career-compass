
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'company_rep', 'user');
CREATE TYPE public.content_status AS ENUM ('draft', 'pending', 'published', 'changes_requested');
CREATE TYPE public.growth_outlook AS ENUM ('declining', 'stable', 'growing', 'high_growth');
CREATE TYPE public.education_level AS ENUM ('high_school', 'certificate', 'associate', 'bachelor', 'graduate');
CREATE TYPE public.pathway_step_type AS ENUM ('course', 'certification', 'degree', 'experience');
CREATE TYPE public.video_provider AS ENUM ('youtube', 'vimeo');

-- =========================================================
-- UPDATED_AT trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- USER_ROLES (separate table — security best practice)
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- =========================================================
-- COMPANIES
-- =========================================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  website TEXT,
  logo_url TEXT,
  logo_emoji TEXT,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- COMPANY_LOCATIONS
-- =========================================================
CREATE TABLE public.company_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  address TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.company_locations ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- CAREERS
-- =========================================================
CREATE TABLE public.careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  typical_day TEXT,
  onet_code TEXT,
  median_salary INTEGER,
  growth_outlook public.growth_outlook DEFAULT 'stable',
  education_level public.education_level DEFAULT 'high_school',
  industry TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  status public.content_status NOT NULL DEFAULT 'published',
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_careers_updated BEFORE UPDATE ON public.careers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- PATHWAY_STEPS
-- =========================================================
CREATE TABLE public.pathway_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type public.pathway_step_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pathway_steps ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- COMPANY_CAREERS
-- =========================================================
CREATE TABLE public.company_careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, career_id)
);
ALTER TABLE public.company_careers ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- VIDEOS
-- =========================================================
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  career_id UUID REFERENCES public.careers(id) ON DELETE CASCADE,
  provider public.video_provider NOT NULL DEFAULT 'youtube',
  url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- INTERVIEW_QUESTIONS
-- =========================================================
CREATE TABLE public.interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_order INTEGER NOT NULL UNIQUE,
  prompt TEXT NOT NULL,
  short_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- INTERVIEWS
-- =========================================================
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  career_id UUID REFERENCES public.careers(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  interviewee_name TEXT NOT NULL,
  interviewee_role TEXT NOT NULL,
  audio_url TEXT,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_interviews_updated BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- INTERVIEW_ANSWERS
-- =========================================================
CREATE TABLE public.interview_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (interview_id, question_id)
);
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_interview_answers_updated BEFORE UPDATE ON public.interview_answers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- BOOKMARKS (placeholder for future auth bookmarks)
-- =========================================================
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  career_id UUID REFERENCES public.careers(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- AUDIT_LOG
-- =========================================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- profiles
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles admin all" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles admin manage" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- companies
CREATE POLICY "companies public read published" ON public.companies FOR SELECT USING (status = 'published' OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "companies owner update" ON public.companies FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "companies owner insert" ON public.companies FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "companies admin delete" ON public.companies FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- company_locations
CREATE POLICY "locations public read" ON public.company_locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND (c.status = 'published' OR c.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "locations owner manage" ON public.company_locations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- careers
CREATE POLICY "careers public read published" ON public.careers FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "careers admin manage" ON public.careers FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- pathway_steps
CREATE POLICY "pathway public read" ON public.pathway_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.careers c WHERE c.id = career_id AND (c.status = 'published' OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "pathway admin manage" ON public.pathway_steps FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- company_careers
CREATE POLICY "company_careers public read" ON public.company_careers FOR SELECT USING (true);
CREATE POLICY "company_careers owner manage" ON public.company_careers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- videos
CREATE POLICY "videos public read" ON public.videos FOR SELECT USING (true);
CREATE POLICY "videos owner manage" ON public.videos FOR ALL USING (
  (company_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  OR public.has_role(auth.uid(), 'admin')
) WITH CHECK (
  (company_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  OR public.has_role(auth.uid(), 'admin')
);

-- interview_questions
CREATE POLICY "questions public read" ON public.interview_questions FOR SELECT USING (true);
CREATE POLICY "questions admin manage" ON public.interview_questions FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- interviews
CREATE POLICY "interviews public read published" ON public.interviews FOR SELECT USING (
  status = 'published' OR auth.uid() = created_by OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_id = auth.uid())
);
CREATE POLICY "interviews owner insert" ON public.interviews FOR INSERT WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "interviews owner update" ON public.interviews FOR UPDATE USING (
  auth.uid() = created_by OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_id = auth.uid())
);
CREATE POLICY "interviews admin delete" ON public.interviews FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- interview_answers
CREATE POLICY "answers read" ON public.interview_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_id AND (
    i.status = 'published' OR i.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = i.company_id AND c.owner_id = auth.uid())
  ))
);
CREATE POLICY "answers manage" ON public.interview_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_id AND (
    i.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = i.company_id AND c.owner_id = auth.uid())
  ))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_id AND (
    i.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = i.company_id AND c.owner_id = auth.uid())
  ))
);

-- bookmarks (future use)
CREATE POLICY "bookmarks self all" ON public.bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- audit_log
CREATE POLICY "audit admin read" ON public.audit_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "audit insert authed" ON public.audit_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =========================================================
-- STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('interview-audio', 'interview-audio', true) ON CONFLICT DO NOTHING;

CREATE POLICY "logos public read" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
CREATE POLICY "logos owner write" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "logos owner update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "logos owner delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "audio public read" ON storage.objects FOR SELECT USING (bucket_id = 'interview-audio');
CREATE POLICY "audio owner write" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'interview-audio' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "audio owner update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'interview-audio' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "audio owner delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'interview-audio' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX idx_careers_status ON public.careers(status);
CREATE INDEX idx_companies_status ON public.companies(status);
CREATE INDEX idx_pathway_career ON public.pathway_steps(career_id, step_order);
CREATE INDEX idx_company_careers_company ON public.company_careers(company_id);
CREATE INDEX idx_company_careers_career ON public.company_careers(career_id);
CREATE INDEX idx_interviews_company ON public.interviews(company_id);
CREATE INDEX idx_interviews_career ON public.interviews(career_id);
