export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acte_cluster_groupings: {
        Row: {
          code: string
          color_hex: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_cross_cutting: boolean
          name: string
        }
        Insert: {
          code: string
          color_hex: string
          created_at?: string
          description?: string | null
          display_order: number
          id?: string
          is_cross_cutting?: boolean
          name: string
        }
        Update: {
          code?: string
          color_hex?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_cross_cutting?: boolean
          name?: string
        }
        Relationships: []
      }
      acte_clusters: {
        Row: {
          code: string
          created_at: string
          description: string
          display_order: number
          grouping_id: string
          icon_name: string | null
          id: string
          is_cross_cutting: boolean
          name: string
          slug: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          display_order: number
          grouping_id: string
          icon_name?: string | null
          id?: string
          is_cross_cutting?: boolean
          name: string
          slug: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          display_order?: number
          grouping_id?: string
          icon_name?: string | null
          id?: string
          is_cross_cutting?: boolean
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "acte_clusters_grouping_id_fkey"
            columns: ["grouping_id"]
            isOneToOne: false
            referencedRelation: "acte_cluster_groupings"
            referencedColumns: ["id"]
          },
        ]
      }
      acte_sub_clusters: {
        Row: {
          cluster_id: string
          code: string
          created_at: string
          display_order: number
          id: string
          name: string
          slug: string
        }
        Insert: {
          cluster_id: string
          code: string
          created_at?: string
          display_order: number
          id?: string
          name: string
          slug: string
        }
        Update: {
          cluster_id?: string
          code?: string
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "acte_sub_clusters_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "acte_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          anonymous_session_id: string | null
          company_id: string | null
          created_at: string
          event_name: string
          id: string
          interview_id: string | null
          metadata: Json
          opportunity_id: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          anonymous_session_id?: string | null
          company_id?: string | null
          created_at?: string
          event_name: string
          id?: string
          interview_id?: string | null
          metadata?: Json
          opportunity_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          anonymous_session_id?: string | null
          company_id?: string | null
          created_at?: string
          event_name?: string
          id?: string
          interview_id?: string | null
          metadata?: Json
          opportunity_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          career_id: string | null
          company_id: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          career_id?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          career_id?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "v_careers_with_cluster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      career_cluster_tags: {
        Row: {
          career_id: string
          cluster_id: string
          created_at: string
          is_primary: boolean
        }
        Insert: {
          career_id: string
          cluster_id: string
          created_at?: string
          is_primary?: boolean
        }
        Update: {
          career_id?: string
          cluster_id?: string
          created_at?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "career_cluster_tags_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_cluster_tags_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "v_careers_with_cluster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_cluster_tags_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "acte_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      career_sub_cluster_tags: {
        Row: {
          career_id: string
          created_at: string
          is_primary: boolean
          sub_cluster_id: string
        }
        Insert: {
          career_id: string
          created_at?: string
          is_primary?: boolean
          sub_cluster_id: string
        }
        Update: {
          career_id?: string
          created_at?: string
          is_primary?: boolean
          sub_cluster_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_sub_cluster_tags_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_sub_cluster_tags_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "v_careers_with_cluster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_sub_cluster_tags_sub_cluster_id_fkey"
            columns: ["sub_cluster_id"]
            isOneToOne: false
            referencedRelation: "acte_sub_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      careers: {
        Row: {
          ai_cs_application: string | null
          anchor_opportunity: Json | null
          created_at: string
          description: string | null
          education_level: Database["public"]["Enums"]["education_level"] | null
          education_pathway_text: string | null
          estimated_salary_high: number | null
          estimated_salary_low: number | null
          featured: boolean
          growth_outlook: Database["public"]["Enums"]["growth_outlook"] | null
          id: string
          industry: string | null
          media_resources: Json
          median_salary: number | null
          onet_code: string | null
          primary_cluster_id: string | null
          primary_sub_cluster_id: string | null
          short_description: string | null
          skills: string[]
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tech_tags: string[]
          title: string
          typical_day: string | null
          updated_at: string
          where_mn_does_this: string | null
        }
        Insert: {
          ai_cs_application?: string | null
          anchor_opportunity?: Json | null
          created_at?: string
          description?: string | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          education_pathway_text?: string | null
          estimated_salary_high?: number | null
          estimated_salary_low?: number | null
          featured?: boolean
          growth_outlook?: Database["public"]["Enums"]["growth_outlook"] | null
          id?: string
          industry?: string | null
          media_resources?: Json
          median_salary?: number | null
          onet_code?: string | null
          primary_cluster_id?: string | null
          primary_sub_cluster_id?: string | null
          short_description?: string | null
          skills?: string[]
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tech_tags?: string[]
          title: string
          typical_day?: string | null
          updated_at?: string
          where_mn_does_this?: string | null
        }
        Update: {
          ai_cs_application?: string | null
          anchor_opportunity?: Json | null
          created_at?: string
          description?: string | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          education_pathway_text?: string | null
          estimated_salary_high?: number | null
          estimated_salary_low?: number | null
          featured?: boolean
          growth_outlook?: Database["public"]["Enums"]["growth_outlook"] | null
          id?: string
          industry?: string | null
          media_resources?: Json
          median_salary?: number | null
          onet_code?: string | null
          primary_cluster_id?: string | null
          primary_sub_cluster_id?: string | null
          short_description?: string | null
          skills?: string[]
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tech_tags?: string[]
          title?: string
          typical_day?: string | null
          updated_at?: string
          where_mn_does_this?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "careers_primary_cluster_id_fkey"
            columns: ["primary_cluster_id"]
            isOneToOne: false
            referencedRelation: "acte_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "careers_primary_sub_cluster_id_fkey"
            columns: ["primary_sub_cluster_id"]
            isOneToOne: false
            referencedRelation: "acte_sub_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          attestation_minor_safety: boolean
          attestation_terms: boolean
          created_at: string
          cs_ai_description: string | null
          deed_rank: number | null
          description: string | null
          hq_city: string | null
          hq_state: string | null
          id: string
          industry: string | null
          internal_contact_email: string | null
          internal_contact_name: string | null
          internal_contact_phone: string | null
          last_verified_date: string | null
          logo_emoji: string | null
          logo_url: string | null
          mn_employees: number | null
          name: string
          owner_id: string | null
          parent_company_id: string | null
          public_careers_url: string | null
          published_at: string | null
          school_relations_contact_email: string | null
          school_relations_contact_name: string | null
          size: Database["public"]["Enums"]["company_size"] | null
          slug: string
          source: string | null
          status: Database["public"]["Enums"]["content_status"]
          tagline: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          website: string | null
        }
        Insert: {
          attestation_minor_safety?: boolean
          attestation_terms?: boolean
          created_at?: string
          cs_ai_description?: string | null
          deed_rank?: number | null
          description?: string | null
          hq_city?: string | null
          hq_state?: string | null
          id?: string
          industry?: string | null
          internal_contact_email?: string | null
          internal_contact_name?: string | null
          internal_contact_phone?: string | null
          last_verified_date?: string | null
          logo_emoji?: string | null
          logo_url?: string | null
          mn_employees?: number | null
          name: string
          owner_id?: string | null
          parent_company_id?: string | null
          public_careers_url?: string | null
          published_at?: string | null
          school_relations_contact_email?: string | null
          school_relations_contact_name?: string | null
          size?: Database["public"]["Enums"]["company_size"] | null
          slug: string
          source?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tagline?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Update: {
          attestation_minor_safety?: boolean
          attestation_terms?: boolean
          created_at?: string
          cs_ai_description?: string | null
          deed_rank?: number | null
          description?: string | null
          hq_city?: string | null
          hq_state?: string | null
          id?: string
          industry?: string | null
          internal_contact_email?: string | null
          internal_contact_name?: string | null
          internal_contact_phone?: string | null
          last_verified_date?: string | null
          logo_emoji?: string | null
          logo_url?: string | null
          mn_employees?: number | null
          name?: string
          owner_id?: string | null
          parent_company_id?: string | null
          public_careers_url?: string | null
          published_at?: string | null
          school_relations_contact_email?: string | null
          school_relations_contact_name?: string | null
          size?: Database["public"]["Enums"]["company_size"] | null
          slug?: string
          source?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tagline?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_careers: {
        Row: {
          career_id: string
          company_id: string
          created_at: string
          id: string
        }
        Insert: {
          career_id: string
          company_id: string
          created_at?: string
          id?: string
        }
        Update: {
          career_id?: string
          company_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_careers_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_careers_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "v_careers_with_cluster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_careers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_locations: {
        Row: {
          address: string | null
          city: string
          company_id: string
          consortium_id: string | null
          created_at: string
          id: string
          is_primary: boolean
          latitude: number | null
          longitude: number | null
          state: string
        }
        Insert: {
          address?: string | null
          city: string
          company_id: string
          consortium_id?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          state: string
        }
        Update: {
          address?: string | null
          city?: string
          company_id?: string
          consortium_id?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_locations_consortium_id_fkey"
            columns: ["consortium_id"]
            isOneToOne: false
            referencedRelation: "mn_perkins_consortia"
            referencedColumns: ["id"]
          },
        ]
      }
      deed_employers: {
        Row: {
          business_description: string | null
          created_at: string
          first_seen_at: string
          id: string
          last_seen_at: string
          matched_company_id: string | null
          mn_employees: number
          organization: string
          rank: number
          removed_from_source: boolean
          source_last_modified: string | null
          source_url: string
          suggested_cluster_id: string | null
          updated_at: string
        }
        Insert: {
          business_description?: string | null
          created_at?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          matched_company_id?: string | null
          mn_employees: number
          organization: string
          rank: number
          removed_from_source?: boolean
          source_last_modified?: string | null
          source_url?: string
          suggested_cluster_id?: string | null
          updated_at?: string
        }
        Update: {
          business_description?: string | null
          created_at?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          matched_company_id?: string | null
          mn_employees?: number
          organization?: string
          rank?: number
          removed_from_source?: boolean
          source_last_modified?: string | null
          source_url?: string
          suggested_cluster_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deed_employers_matched_company_id_fkey"
            columns: ["matched_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deed_employers_suggested_cluster_id_fkey"
            columns: ["suggested_cluster_id"]
            isOneToOne: false
            referencedRelation: "acte_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      deed_sync_log: {
        Row: {
          duration_ms: number | null
          error_message: string | null
          id: string
          ran_at: string
          rows_added: number
          rows_removed: number
          rows_unchanged: number
          rows_updated: number
          source_file_hash: string | null
          source_last_modified: string | null
          status: string
          triggered_by: string
        }
        Insert: {
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          ran_at?: string
          rows_added?: number
          rows_removed?: number
          rows_unchanged?: number
          rows_updated?: number
          source_file_hash?: string | null
          source_last_modified?: string | null
          status: string
          triggered_by: string
        }
        Update: {
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          ran_at?: string
          rows_added?: number
          rows_removed?: number
          rows_unchanged?: number
          rows_updated?: number
          source_file_hash?: string | null
          source_last_modified?: string | null
          status?: string
          triggered_by?: string
        }
        Relationships: []
      }
      interview_answers: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          interview_id: string
          question_id: string
          updated_at: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          interview_id: string
          question_id: string
          updated_at?: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          interview_id?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_answers_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          created_at: string
          id: string
          prompt: string
          question_order: number
          short_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt: string
          question_order: number
          short_label: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt?: string
          question_order?: number
          short_label?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          audio_url: string | null
          background_blurb: string | null
          captions_status: Database["public"]["Enums"]["captions_status"] | null
          career_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          display_order: number
          duration_seconds: number | null
          featured: boolean
          id: string
          interviewee_name: string
          interviewee_role: string
          key_topics: Database["public"]["Enums"]["interview_topic"][] | null
          status: Database["public"]["Enums"]["content_status"]
          thumbnail_url: string | null
          transcript_text: string | null
          updated_at: string
          video_url: string | null
          years_at_company: number | null
        }
        Insert: {
          audio_url?: string | null
          background_blurb?: string | null
          captions_status?:
            | Database["public"]["Enums"]["captions_status"]
            | null
          career_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          duration_seconds?: number | null
          featured?: boolean
          id?: string
          interviewee_name: string
          interviewee_role: string
          key_topics?: Database["public"]["Enums"]["interview_topic"][] | null
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          transcript_text?: string | null
          updated_at?: string
          video_url?: string | null
          years_at_company?: number | null
        }
        Update: {
          audio_url?: string | null
          background_blurb?: string | null
          captions_status?:
            | Database["public"]["Enums"]["captions_status"]
            | null
          career_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          duration_seconds?: number | null
          featured?: boolean
          id?: string
          interviewee_name?: string
          interviewee_role?: string
          key_topics?: Database["public"]["Enums"]["interview_topic"][] | null
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          transcript_text?: string | null
          updated_at?: string
          video_url?: string | null
          years_at_company?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "v_careers_with_cluster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mn_perkins_consortia: {
        Row: {
          anchor_college: string
          code: string
          created_at: string
          display_order: number
          id: string
          is_metro: boolean
          name: string
          region_label: string
        }
        Insert: {
          anchor_college: string
          code: string
          created_at?: string
          display_order: number
          id?: string
          is_metro?: boolean
          name: string
          region_label: string
        }
        Update: {
          anchor_college?: string
          code?: string
          created_at?: string
          display_order?: number
          id?: string
          is_metro?: boolean
          name?: string
          region_label?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          application_deadline: string | null
          application_url: string
          company_id: string
          compensation: string | null
          created_at: string
          description: string
          duration: string
          expires_at: string
          format: Database["public"]["Enums"]["work_format"]
          grade_level_eligibility: Database["public"]["Enums"]["grade_level"][]
          hours_per_week_max: number | null
          hours_per_week_min: number | null
          id: string
          location_city: string | null
          location_state: string | null
          owner_id: string | null
          paid: boolean
          positions_available: number | null
          preferred_skills: string[]
          requirements: string[]
          responsibilities: string[]
          start_date: string | null
          status: Database["public"]["Enums"]["opportunity_status"]
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          application_url: string
          company_id: string
          compensation?: string | null
          created_at?: string
          description: string
          duration: string
          expires_at?: string
          format: Database["public"]["Enums"]["work_format"]
          grade_level_eligibility: Database["public"]["Enums"]["grade_level"][]
          hours_per_week_max?: number | null
          hours_per_week_min?: number | null
          id?: string
          location_city?: string | null
          location_state?: string | null
          owner_id?: string | null
          paid: boolean
          positions_available?: number | null
          preferred_skills?: string[]
          requirements?: string[]
          responsibilities?: string[]
          start_date?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          application_url?: string
          company_id?: string
          compensation?: string | null
          created_at?: string
          description?: string
          duration?: string
          expires_at?: string
          format?: Database["public"]["Enums"]["work_format"]
          grade_level_eligibility?: Database["public"]["Enums"]["grade_level"][]
          hours_per_week_max?: number | null
          hours_per_week_min?: number | null
          id?: string
          location_city?: string | null
          location_state?: string | null
          owner_id?: string | null
          paid?: boolean
          positions_available?: number | null
          preferred_skills?: string[]
          requirements?: string[]
          responsibilities?: string[]
          start_date?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          title?: string
          type?: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_sub_cluster_tags: {
        Row: {
          created_at: string
          is_primary: boolean
          opportunity_id: string
          sub_cluster_id: string
        }
        Insert: {
          created_at?: string
          is_primary?: boolean
          opportunity_id: string
          sub_cluster_id: string
        }
        Update: {
          created_at?: string
          is_primary?: boolean
          opportunity_id?: string
          sub_cluster_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_sub_cluster_tags_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_sub_cluster_tags_sub_cluster_id_fkey"
            columns: ["sub_cluster_id"]
            isOneToOne: false
            referencedRelation: "acte_sub_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_steps: {
        Row: {
          career_id: string
          created_at: string
          description: string | null
          id: string
          step_order: number
          step_type: Database["public"]["Enums"]["pathway_step_type"]
          title: string
        }
        Insert: {
          career_id: string
          created_at?: string
          description?: string | null
          id?: string
          step_order: number
          step_type: Database["public"]["Enums"]["pathway_step_type"]
          title: string
        }
        Update: {
          career_id?: string
          created_at?: string
          description?: string | null
          id?: string
          step_order?: number
          step_type?: Database["public"]["Enums"]["pathway_step_type"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathway_steps_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_steps_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "v_careers_with_cluster"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      school_partnerships: {
        Row: {
          city: string
          company_id: string
          created_at: string
          id: string
          relationship_types: Database["public"]["Enums"]["relationship_type"][]
          school_name: string
          school_type: Database["public"]["Enums"]["school_type"]
          state: string
          updated_at: string
        }
        Insert: {
          city: string
          company_id: string
          created_at?: string
          id?: string
          relationship_types: Database["public"]["Enums"]["relationship_type"][]
          school_name: string
          school_type: Database["public"]["Enums"]["school_type"]
          state: string
          updated_at?: string
        }
        Update: {
          city?: string
          company_id?: string
          created_at?: string
          id?: string
          relationship_types?: Database["public"]["Enums"]["relationship_type"][]
          school_name?: string
          school_type?: Database["public"]["Enums"]["school_type"]
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_partnerships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          company_id: string
          consent_on_file: boolean
          created_at: string
          display_order: number
          id: string
          linkedin_url: string | null
          person_name: string
          photo_url: string | null
          quote: string
          role_held: string
          school_or_program: string
          updated_at: string
          year: number
        }
        Insert: {
          company_id: string
          consent_on_file?: boolean
          created_at?: string
          display_order?: number
          id?: string
          linkedin_url?: string | null
          person_name: string
          photo_url?: string | null
          quote: string
          role_held: string
          school_or_program: string
          updated_at?: string
          year: number
        }
        Update: {
          company_id?: string
          consent_on_file?: boolean
          created_at?: string
          display_order?: number
          id?: string
          linkedin_url?: string | null
          person_name?: string
          photo_url?: string | null
          quote?: string
          role_held?: string
          school_or_program?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          career_id: string | null
          company_id: string | null
          created_at: string
          id: string
          provider: Database["public"]["Enums"]["video_provider"]
          title: string | null
          url: string
        }
        Insert: {
          career_id?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          provider?: Database["public"]["Enums"]["video_provider"]
          title?: string | null
          url: string
        }
        Update: {
          career_id?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          provider?: Database["public"]["Enums"]["video_provider"]
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "v_careers_with_cluster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_careers_with_cluster: {
        Row: {
          cluster_code: string | null
          cluster_is_cross_cutting: boolean | null
          cluster_name: string | null
          cluster_slug: string | null
          created_at: string | null
          description: string | null
          education_level: Database["public"]["Enums"]["education_level"] | null
          featured: boolean | null
          field_code: string | null
          field_color: string | null
          field_name: string | null
          growth_outlook: Database["public"]["Enums"]["growth_outlook"] | null
          id: string | null
          industry: string | null
          median_salary: number | null
          onet_code: string | null
          primary_cluster_id: string | null
          primary_sub_cluster_id: string | null
          short_description: string | null
          skills: string[] | null
          slug: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          sub_cluster_code: string | null
          sub_cluster_name: string | null
          sub_cluster_slug: string | null
          tech_tags: string[] | null
          title: string | null
          typical_day: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "careers_primary_cluster_id_fkey"
            columns: ["primary_cluster_id"]
            isOneToOne: false
            referencedRelation: "acte_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "careers_primary_sub_cluster_id_fkey"
            columns: ["primary_sub_cluster_id"]
            isOneToOne: false
            referencedRelation: "acte_sub_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cluster_id: { Args: { _code: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      subcluster_id: { Args: { _code: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "company_rep" | "user"
      captions_status: "yt_auto" | "vtt_uploaded" | "manual_review_done"
      company_size: "1-10" | "11-50" | "51-200" | "201-1000" | "1000+"
      content_status: "draft" | "pending" | "published" | "changes_requested"
      education_level:
        | "high_school"
        | "certificate"
        | "associate"
        | "bachelor"
        | "graduate"
      grade_level:
        | "grade_9"
        | "grade_10"
        | "grade_11"
        | "grade_12"
        | "college_freshman"
        | "college_sophomore"
        | "college_junior"
        | "college_senior"
        | "recent_graduate"
      growth_outlook: "declining" | "stable" | "growing" | "high_growth"
      interview_topic:
        | "day_in_the_life"
        | "career_path"
        | "how_i_got_hired"
        | "skills_i_use"
        | "advice_for_students"
      opportunity_status: "draft" | "active" | "expired" | "filled" | "archived"
      opportunity_type:
        | "internship"
        | "apprenticeship"
        | "job_shadow"
        | "externship"
        | "fellowship"
        | "entry_level"
      pathway_step_type: "course" | "certification" | "degree" | "experience"
      relationship_type:
        | "hiring_pipeline"
        | "curriculum_partner"
        | "guest_speakers"
        | "equipment_donation"
        | "internship_host"
      school_type:
        | "high_school"
        | "two_year_college"
        | "four_year_college"
        | "technical_college"
      verification_status: "unverified" | "verified" | "flagged"
      video_provider: "youtube" | "vimeo"
      work_format: "in_person" | "remote" | "hybrid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "company_rep", "user"],
      captions_status: ["yt_auto", "vtt_uploaded", "manual_review_done"],
      company_size: ["1-10", "11-50", "51-200", "201-1000", "1000+"],
      content_status: ["draft", "pending", "published", "changes_requested"],
      education_level: [
        "high_school",
        "certificate",
        "associate",
        "bachelor",
        "graduate",
      ],
      grade_level: [
        "grade_9",
        "grade_10",
        "grade_11",
        "grade_12",
        "college_freshman",
        "college_sophomore",
        "college_junior",
        "college_senior",
        "recent_graduate",
      ],
      growth_outlook: ["declining", "stable", "growing", "high_growth"],
      interview_topic: [
        "day_in_the_life",
        "career_path",
        "how_i_got_hired",
        "skills_i_use",
        "advice_for_students",
      ],
      opportunity_status: ["draft", "active", "expired", "filled", "archived"],
      opportunity_type: [
        "internship",
        "apprenticeship",
        "job_shadow",
        "externship",
        "fellowship",
        "entry_level",
      ],
      pathway_step_type: ["course", "certification", "degree", "experience"],
      relationship_type: [
        "hiring_pipeline",
        "curriculum_partner",
        "guest_speakers",
        "equipment_donation",
        "internship_host",
      ],
      school_type: [
        "high_school",
        "two_year_college",
        "four_year_college",
        "technical_college",
      ],
      verification_status: ["unverified", "verified", "flagged"],
      video_provider: ["youtube", "vimeo"],
      work_format: ["in_person", "remote", "hybrid"],
    },
  },
} as const
