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
          created_at: string
          description: string | null
          education_level: Database["public"]["Enums"]["education_level"] | null
          featured: boolean
          growth_outlook: Database["public"]["Enums"]["growth_outlook"] | null
          id: string
          industry: string | null
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
        }
        Insert: {
          created_at?: string
          description?: string | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          featured?: boolean
          growth_outlook?: Database["public"]["Enums"]["growth_outlook"] | null
          id?: string
          industry?: string | null
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
        }
        Update: {
          created_at?: string
          description?: string | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          featured?: boolean
          growth_outlook?: Database["public"]["Enums"]["growth_outlook"] | null
          id?: string
          industry?: string | null
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
          created_at: string
          description: string | null
          id: string
          industry: string | null
          logo_emoji: string | null
          logo_url: string | null
          name: string
          owner_id: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          logo_emoji?: string | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          logo_emoji?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
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
          career_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          interviewee_name: string
          interviewee_role: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          career_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          interviewee_name: string
          interviewee_role: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          career_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          interviewee_name?: string
          interviewee_role?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "company_rep" | "user"
      content_status: "draft" | "pending" | "published" | "changes_requested"
      education_level:
        | "high_school"
        | "certificate"
        | "associate"
        | "bachelor"
        | "graduate"
      growth_outlook: "declining" | "stable" | "growing" | "high_growth"
      pathway_step_type: "course" | "certification" | "degree" | "experience"
      video_provider: "youtube" | "vimeo"
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
      content_status: ["draft", "pending", "published", "changes_requested"],
      education_level: [
        "high_school",
        "certificate",
        "associate",
        "bachelor",
        "graduate",
      ],
      growth_outlook: ["declining", "stable", "growing", "high_growth"],
      pathway_step_type: ["course", "certification", "degree", "experience"],
      video_provider: ["youtube", "vimeo"],
    },
  },
} as const
