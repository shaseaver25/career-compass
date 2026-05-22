// Enum value labels used across dashboard forms.
// Keep values in sync with public.* enums in the database.

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;

export const OPPORTUNITY_TYPES = [
  { value: "internship", label: "Internship" },
  { value: "apprenticeship", label: "Apprenticeship" },
  { value: "job_shadow", label: "Job shadow" },
  { value: "externship", label: "Externship" },
  { value: "fellowship", label: "Fellowship" },
  { value: "entry_level", label: "Entry level" },
] as const;

export const OPPORTUNITY_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "filled", label: "Filled" },
  { value: "archived", label: "Archived" },
] as const;

export const WORK_FORMATS = [
  { value: "in_person", label: "In person" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
] as const;

export const GRADE_LEVELS = [
  { value: "grade_9", label: "Grade 9" },
  { value: "grade_10", label: "Grade 10" },
  { value: "grade_11", label: "Grade 11" },
  { value: "grade_12", label: "Grade 12" },
  { value: "college_freshman", label: "College freshman" },
  { value: "college_sophomore", label: "College sophomore" },
  { value: "college_junior", label: "College junior" },
  { value: "college_senior", label: "College senior" },
  { value: "recent_graduate", label: "Recent graduate" },
] as const;

export const INTERVIEW_TOPICS = [
  { value: "day_in_the_life", label: "Day in the life" },
  { value: "career_path", label: "Career path" },
  { value: "how_i_got_hired", label: "How I got hired" },
  { value: "skills_i_use", label: "Skills I use" },
  { value: "advice_for_students", label: "Advice for students" },
] as const;

export const CAPTIONS_STATUSES = [
  { value: "yt_auto", label: "YouTube auto-captions" },
  { value: "vtt_uploaded", label: "VTT file uploaded" },
  { value: "manual_review_done", label: "Manually reviewed" },
] as const;

export const SCHOOL_TYPES = [
  { value: "high_school", label: "High school" },
  { value: "two_year_college", label: "Two-year college" },
  { value: "four_year_college", label: "Four-year college" },
  { value: "technical_college", label: "Technical college" },
] as const;

export const RELATIONSHIP_TYPES = [
  { value: "hiring_pipeline", label: "Hiring pipeline" },
  { value: "curriculum_partner", label: "Curriculum partner" },
  { value: "guest_speakers", label: "Guest speakers" },
  { value: "equipment_donation", label: "Equipment donation" },
  { value: "internship_host", label: "Internship host" },
] as const;