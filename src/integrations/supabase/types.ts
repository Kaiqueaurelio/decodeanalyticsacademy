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
      activity_logs: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"]
          created_at: string
          id: string
          ip_address: string | null
          material_id: string | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          created_at?: string
          id?: string
          ip_address?: string | null
          material_id?: string | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          created_at?: string
          id?: string
          ip_address?: string | null
          material_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      annotations: {
        Row: {
          apostila_id: string
          color: string | null
          content: string
          created_at: string
          id: string
          position: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apostila_id: string
          color?: string | null
          content: string
          created_at?: string
          id?: string
          position?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apostila_id?: string
          color?: string | null
          content?: string
          created_at?: string
          id?: string
          position?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "annotations_apostila_id_fkey"
            columns: ["apostila_id"]
            isOneToOne: false
            referencedRelation: "apostilas"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string
          id: string
          image_url: string | null
          link_url: string | null
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      answers: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          is_correct: boolean
          selected_answer: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          is_correct: boolean
          selected_answer: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          is_correct?: boolean
          selected_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      apostila_chats: {
        Row: {
          apostila_id: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          apostila_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          apostila_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      apostila_materials: {
        Row: {
          apostila_id: string
          created_at: string
          id: string
          material_id: string
          sort_order: number
        }
        Insert: {
          apostila_id: string
          created_at?: string
          id?: string
          material_id: string
          sort_order?: number
        }
        Update: {
          apostila_id?: string
          created_at?: string
          id?: string
          material_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "apostila_materials_apostila_id_fkey"
            columns: ["apostila_id"]
            isOneToOne: false
            referencedRelation: "apostilas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apostila_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      apostilas: {
        Row: {
          category: string
          content: string | null
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          published: boolean
          source_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          published?: boolean
          source_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          published?: boolean
          source_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          criteria: string | null
          description: string | null
          icon: string
          id: string
          name: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          criteria?: string | null
          description?: string | null
          icon?: string
          id?: string
          name: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          criteria?: string | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
          xp_reward?: number
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string
          id: string
          source_pdf_url: string | null
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string
          id?: string
          source_pdf_url?: string | null
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          id?: string
          source_pdf_url?: string | null
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          context_id: string
          context_type: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          context_id: string
          context_type: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          context_id?: string
          context_type?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_channels: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_general: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_general?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_general?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      community_post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          pinned: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          pinned?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      community_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      downloads: {
        Row: {
          downloaded_at: string
          id: string
          material_id: string
          user_id: string
        }
        Insert: {
          downloaded_at?: string
          id?: string
          material_id: string
          user_id: string
        }
        Update: {
          downloaded_at?: string
          id?: string
          material_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "downloads_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          apostila_id: string
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          min_chars: number
          options: Json
          question: string
          reference_answer: string | null
          type: string
        }
        Insert: {
          apostila_id: string
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          min_chars?: number
          options?: Json
          question: string
          reference_answer?: string | null
          type?: string
        }
        Update: {
          apostila_id?: string
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          min_chars?: number
          options?: Json
          question?: string
          reference_answer?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_apostila_id_fkey"
            columns: ["apostila_id"]
            isOneToOne: false
            referencedRelation: "apostilas"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          apostila_id: string | null
          back: string
          created_at: string
          difficulty: number
          front: string
          id: string
          next_review: string | null
          user_id: string
        }
        Insert: {
          apostila_id?: string | null
          back: string
          created_at?: string
          difficulty?: number
          front: string
          id?: string
          next_review?: string | null
          user_id: string
        }
        Update: {
          apostila_id?: string | null
          back?: string
          created_at?: string
          difficulty?: number
          front?: string
          id?: string
          next_review?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_apostila_id_fkey"
            columns: ["apostila_id"]
            isOneToOne: false
            referencedRelation: "apostilas"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_path: string | null
          file_url: string | null
          id: string
          title: string
          type: Database["public"]["Enums"]["material_type"]
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          title: string
          type?: Database["public"]["Enums"]["material_type"]
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          title?: string
          type?: Database["public"]["Enums"]["material_type"]
        }
        Relationships: [
          {
            foreignKeyName: "materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      mention_notifications: {
        Row: {
          author_id: string
          context_id: string
          context_type: string
          created_at: string
          id: string
          read: boolean
          recipient_id: string
          snippet: string
        }
        Insert: {
          author_id: string
          context_id: string
          context_type: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id: string
          snippet?: string
        }
        Update: {
          author_id?: string
          context_id?: string
          context_type?: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string
          snippet?: string
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          apostila_id: string | null
          completed: boolean
          created_at: string
          duration: number
          id: string
          user_id: string
        }
        Insert: {
          apostila_id?: string | null
          completed?: boolean
          created_at?: string
          duration?: number
          id?: string
          user_id: string
        }
        Update: {
          apostila_id?: string | null
          completed?: boolean
          created_at?: string
          duration?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_apostila_id_fkey"
            columns: ["apostila_id"]
            isOneToOne: false
            referencedRelation: "apostilas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_blocked: boolean
          locked_at: string | null
          login_attempts: number
          ra: string | null
          user_id: string
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean
          locked_at?: string | null
          login_attempts?: number
          ra?: string | null
          user_id: string
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean
          locked_at?: string | null
          login_attempts?: number
          ra?: string | null
          user_id?: string
        }
        Relationships: []
      }
      respostas_foto: {
        Row: {
          created_at: string
          exercise_id: string | null
          feedback_ia: string | null
          id: string
          imagem_url: string
          nota: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id?: string | null
          feedback_ia?: string | null
          id?: string
          imagem_url: string
          nota?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string | null
          feedback_ia?: string | null
          id?: string
          imagem_url?: string
          nota?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "respostas_foto_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string | null
          id: string
          resolved: boolean
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description?: string | null
          id?: string
          resolved?: boolean
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string | null
          id?: string
          resolved?: boolean
          user_id?: string
        }
        Relationships: []
      }
      study_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_study_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_study_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_study_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          content: string
          course: string | null
          created_at: string
          id: string
          rating: number
          semester: number | null
          user_id: string
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          content: string
          course?: string | null
          created_at?: string
          id?: string
          rating?: number
          semester?: number | null
          user_id: string
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          content?: string
          course?: string | null
          created_at?: string
          id?: string
          rating?: number
          semester?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          created_at: string
          id: string
          level: number
          updated_at: string
          user_id: string
          xp_points: number
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          updated_at?: string
          user_id: string
          xp_points?: number
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          updated_at?: string
          user_id?: string
          xp_points?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_exercise_answer: {
        Args: { _exercise_id: string; _selected_answer: string }
        Returns: Json
      }
      delete_user_completely: {
        Args: { _target_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_xp: {
        Args: { _amount: number; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      activity_action:
        | "view"
        | "download"
        | "screenshot"
        | "login"
        | "logout"
        | "unauthorized_access"
      app_role: "admin" | "user"
      material_type:
        | "pdf"
        | "image"
        | "video"
        | "audio"
        | "powerpoint"
        | "link"
        | "exam"
        | "word"
        | "excel"
        | "gif"
        | "other"
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
      activity_action: [
        "view",
        "download",
        "screenshot",
        "login",
        "logout",
        "unauthorized_access",
      ],
      app_role: ["admin", "user"],
      material_type: [
        "pdf",
        "image",
        "video",
        "audio",
        "powerpoint",
        "link",
        "exam",
        "word",
        "excel",
        "gif",
        "other",
      ],
    },
  },
} as const
