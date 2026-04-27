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
            foreignKeyName: "bookmarks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          short_description: string | null
          skills: string[]
          slug: string
          status: Database["public"]["Enums"]["content_status"]
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
          short_description?: string | null
          skills?: string[]
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
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
          short_description?: string | null
          skills?: string[]
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          typical_day?: string | null
          updated_at?: string
        }
        Relationships: []
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
          created_at: string
          id: string
          is_primary: boolean
          state: string
        }
        Insert: {
          address?: string | null
          city: string
          company_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          state: string
        }
        Update: {
          address?: string | null
          city?: string
          company_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
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
            foreignKeyName: "interviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      [_ in never]: never
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
