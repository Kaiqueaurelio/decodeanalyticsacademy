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
      ad_clicks: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_views: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_views_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          ad_type: string
          click_count: number
          created_at: string
          created_by: string | null
          description: string | null
          display_duration: number
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          position: number
          start_date: string | null
          target_pages: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          ad_type?: string
          click_count?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_duration?: number
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          position?: number
          start_date?: string | null
          target_pages?: string[]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          ad_type?: string
          click_count?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_duration?: number
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          position?: number
          start_date?: string | null
          target_pages?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
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
      apostila_chapters: {
        Row: {
          created_at: string
          estimated_minutes: number | null
          id: string
          module_id: string
          order_index: number
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          module_id: string
          order_index?: number
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          module_id?: string
          order_index?: number
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apostila_chapters_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "apostila_modules"
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
      apostila_comments: {
        Row: {
          apostila_id: string
          content: string
          created_at: string
          id: string
          likes_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          apostila_id: string
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          apostila_id?: string
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apostila_comments_apostila_id_fkey"
            columns: ["apostila_id"]
            isOneToOne: false
            referencedRelation: "apostilas"
            referencedColumns: ["id"]
          },
        ]
      }
      apostila_completions: {
        Row: {
          apostila_id: string
          completed_at: string
          id: string
          user_id: string
        }
        Insert: {
          apostila_id: string
          completed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          apostila_id?: string
          completed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      apostila_favorites: {
        Row: {
          apostila_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          apostila_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          apostila_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      apostila_lesson_bookmarks: {
        Row: {
          created_at: string
          id: string
          label: string | null
          lesson_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          lesson_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apostila_lesson_bookmarks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "apostila_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      apostila_lesson_notes: {
        Row: {
          body: string
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apostila_lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "apostila_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      apostila_lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          last_position: number | null
          lesson_id: string
          seconds_spent: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          last_position?: number | null
          lesson_id: string
          seconds_spent?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          last_position?: number | null
          lesson_id?: string
          seconds_spent?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apostila_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "apostila_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      apostila_lessons: {
        Row: {
          chapter_id: string
          content_md: string
          content_status: string
          created_at: string
          difficulty: string | null
          estimated_minutes: number | null
          id: string
          objectives: string[] | null
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          chapter_id: string
          content_md?: string
          content_status?: string
          created_at?: string
          difficulty?: string | null
          estimated_minutes?: number | null
          id?: string
          objectives?: string[] | null
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          content_md?: string
          content_status?: string
          created_at?: string
          difficulty?: string | null
          estimated_minutes?: number | null
          id?: string
          objectives?: string[] | null
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apostila_lessons_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "apostila_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      apostila_likes: {
        Row: {
          apostila_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          apostila_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          apostila_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apostila_likes_apostila_id_fkey"
            columns: ["apostila_id"]
            isOneToOne: false
            referencedRelation: "apostilas"
            referencedColumns: ["id"]
          },
        ]
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
      apostila_modules: {
        Row: {
          apostila_id: string
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          apostila_id: string
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          apostila_id?: string
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apostila_modules_apostila_id_fkey"
            columns: ["apostila_id"]
            isOneToOne: false
            referencedRelation: "apostilas"
            referencedColumns: ["id"]
          },
        ]
      }
      apostila_shares: {
        Row: {
          apostila_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          share_token: string
          view_count: number
        }
        Insert: {
          apostila_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          share_token: string
          view_count?: number
        }
        Update: {
          apostila_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          share_token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "apostila_shares_apostila_id_fkey"
            columns: ["apostila_id"]
            isOneToOne: false
            referencedRelation: "apostilas"
            referencedColumns: ["id"]
          },
        ]
      }
      apostila_summaries: {
        Row: {
          apostila_id: string
          generated_at: string
          generated_by: string | null
          id: string
          mindmap_mermaid: string | null
          summary_md: string | null
        }
        Insert: {
          apostila_id: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          mindmap_mermaid?: string | null
          summary_md?: string | null
        }
        Update: {
          apostila_id?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          mindmap_mermaid?: string | null
          summary_md?: string | null
        }
        Relationships: []
      }
      apostila_views: {
        Row: {
          apostila_id: string
          id: string
          session_id: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          apostila_id: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          apostila_id?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apostila_views_apostila_id_fkey"
            columns: ["apostila_id"]
            isOneToOne: false
            referencedRelation: "apostilas"
            referencedColumns: ["id"]
          },
        ]
      }
      apostilas: {
        Row: {
          category: string
          content: string | null
          content_backup: string | null
          course: string[] | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          embedding: string | null
          file_url: string | null
          id: string
          published: boolean
          reformatted_at: string | null
          semester: number | null
          source_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string | null
          content_backup?: string | null
          course?: string[] | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          file_url?: string | null
          id?: string
          published?: boolean
          reformatted_at?: string | null
          semester?: number | null
          source_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string | null
          content_backup?: string | null
          course?: string[] | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          file_url?: string | null
          id?: string
          published?: boolean
          reformatted_at?: string | null
          semester?: number | null
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
      books: {
        Row: {
          author: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_type: string
          file_url: string
          id: string
          published: boolean
          title: string
          total_pages: number | null
          updated_at: string
        }
        Insert: {
          author?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_type: string
          file_url: string
          id?: string
          published?: boolean
          title: string
          total_pages?: number | null
          updated_at?: string
        }
        Update: {
          author?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_type?: string
          file_url?: string
          id?: string
          published?: boolean
          title?: string
          total_pages?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      calculator_grades: {
        Row: {
          created_at: string
          exam: number | null
          id: string
          notes: string | null
          np1: number | null
          np2: number | null
          semester: number | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam?: number | null
          id?: string
          notes?: string | null
          np1?: number | null
          np2?: number | null
          semester?: number | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam?: number | null
          id?: string
          notes?: string | null
          np1?: number | null
          np2?: number | null
          semester?: number | null
          subject?: string
          updated_at?: string
          user_id?: string
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
          allow_image_upload: boolean
          apostila_id: string
          correct_answer: string
          created_at: string
          expected_answer: Json
          explanation: string | null
          id: string
          min_chars: number
          options: Json
          question: string
          question_type: string
          reference_answer: string | null
          sort_order: number
          type: string
        }
        Insert: {
          allow_image_upload?: boolean
          apostila_id: string
          correct_answer: string
          created_at?: string
          expected_answer?: Json
          explanation?: string | null
          id?: string
          min_chars?: number
          options?: Json
          question: string
          question_type?: string
          reference_answer?: string | null
          sort_order?: number
          type?: string
        }
        Update: {
          allow_image_upload?: boolean
          apostila_id?: string
          correct_answer?: string
          created_at?: string
          expected_answer?: Json
          explanation?: string | null
          id?: string
          min_chars?: number
          options?: Json
          question?: string
          question_type?: string
          reference_answer?: string | null
          sort_order?: number
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
          ease_factor: number
          front: string
          id: string
          interval_days: number
          last_reviewed: string | null
          next_review: string | null
          repetitions: number
          user_id: string
        }
        Insert: {
          apostila_id?: string | null
          back: string
          created_at?: string
          difficulty?: number
          ease_factor?: number
          front: string
          id?: string
          interval_days?: number
          last_reviewed?: string | null
          next_review?: string | null
          repetitions?: number
          user_id: string
        }
        Update: {
          apostila_id?: string | null
          back?: string
          created_at?: string
          difficulty?: number
          ease_factor?: number
          front?: string
          id?: string
          interval_days?: number
          last_reviewed?: string | null
          next_review?: string | null
          repetitions?: number
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
      free_courses: {
        Row: {
          area: string
          certificate: string
          created_at: string
          description: string
          featured: boolean
          icon_key: string
          id: string
          is_active: boolean
          link_url: string
          provider: string
          sort_order: number
          status: string
          tags: string[]
          title: string
          updated_at: string
          validity_note: string
          workload: string
        }
        Insert: {
          area?: string
          certificate?: string
          created_at?: string
          description?: string
          featured?: boolean
          icon_key?: string
          id?: string
          is_active?: boolean
          link_url?: string
          provider?: string
          sort_order?: number
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          validity_note?: string
          workload?: string
        }
        Update: {
          area?: string
          certificate?: string
          created_at?: string
          description?: string
          featured?: boolean
          icon_key?: string
          id?: string
          is_active?: boolean
          link_url?: string
          provider?: string
          sort_order?: number
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          validity_note?: string
          workload?: string
        }
        Relationships: []
      }
      material_favorites: {
        Row: {
          created_at: string
          id: string
          material_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_favorites_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      playbooks_bookmarks: {
        Row: {
          book_id: string
          created_at: string
          id: string
          label: string | null
          location: string | null
          page: number | null
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          label?: string | null
          location?: string | null
          page?: number | null
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          label?: string | null
          location?: string | null
          page?: number | null
          user_id?: string
        }
        Relationships: []
      }
      playbooks_highlights: {
        Row: {
          book_id: string
          color: string
          created_at: string
          end_location: string | null
          id: string
          page: number | null
          start_location: string | null
          text: string
          user_id: string
        }
        Insert: {
          book_id: string
          color?: string
          created_at?: string
          end_location?: string | null
          id?: string
          page?: number | null
          start_location?: string | null
          text: string
          user_id: string
        }
        Update: {
          book_id?: string
          color?: string
          created_at?: string
          end_location?: string | null
          id?: string
          page?: number | null
          start_location?: string | null
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      playbooks_notes: {
        Row: {
          book_id: string
          content: string
          created_at: string
          highlight_id: string | null
          id: string
          page: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          content: string
          created_at?: string
          highlight_id?: string | null
          id?: string
          page?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          content?: string
          created_at?: string
          highlight_id?: string | null
          id?: string
          page?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbooks_notes_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "playbooks_highlights"
            referencedColumns: ["id"]
          },
        ]
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
          content_scope: string
          course: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_blocked: boolean
          locked_at: string | null
          login_attempts: number
          must_change_password: boolean
          ra: string | null
          semester: number | null
          user_id: string
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          content_scope?: string
          course?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean
          locked_at?: string | null
          login_attempts?: number
          must_change_password?: boolean
          ra?: string | null
          semester?: number | null
          user_id: string
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          content_scope?: string
          course?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean
          locked_at?: string | null
          login_attempts?: number
          must_change_password?: boolean
          ra?: string | null
          semester?: number | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          book_id: string
          current_page: number | null
          file_type: string
          id: string
          location: string | null
          progress_percentage: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          current_page?: number | null
          file_type: string
          id?: string
          location?: string | null
          progress_percentage?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          current_page?: number | null
          file_type?: string
          id?: string
          location?: string | null
          progress_percentage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      respostas_foto: {
        Row: {
          correct: string | null
          created_at: string
          detected_answer: string | null
          exercise_id: string | null
          expected_answer_snapshot: string | null
          feedback_ia: string | null
          id: string
          imagem_url: string
          nota: number | null
          score: number | null
          user_id: string
        }
        Insert: {
          correct?: string | null
          created_at?: string
          detected_answer?: string | null
          exercise_id?: string | null
          expected_answer_snapshot?: string | null
          feedback_ia?: string | null
          id?: string
          imagem_url: string
          nota?: number | null
          score?: number | null
          user_id: string
        }
        Update: {
          correct?: string | null
          created_at?: string
          detected_answer?: string | null
          exercise_id?: string | null
          expected_answer_snapshot?: string | null
          feedback_ia?: string | null
          id?: string
          imagem_url?: string
          nota?: number | null
          score?: number | null
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
      rss_feeds: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          sort_order: number
          source: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          source: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          source?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
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
      sponsor_lead_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          lead_id: string
          note: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          lead_id: string
          note: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          lead_id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sponsor_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_leads: {
        Row: {
          budget: string | null
          channel: string
          company: string
          contact_name: string
          created_at: string
          email: string
          goal: string | null
          id: string
          notes: string | null
          period: string | null
          phone: string | null
          plan: string | null
          site: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          budget?: string | null
          channel?: string
          company: string
          contact_name: string
          created_at?: string
          email: string
          goal?: string | null
          id?: string
          notes?: string | null
          period?: string | null
          phone?: string | null
          plan?: string | null
          site?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: string | null
          channel?: string
          company?: string
          contact_name?: string
          created_at?: string
          email?: string
          goal?: string | null
          id?: string
          notes?: string | null
          period?: string | null
          phone?: string | null
          plan?: string | null
          site?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          apostila_id: string
          apostila_title: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          plan_date: string
          pomodoros: number
          reason: string
          related_event_date: string | null
          related_event_id: string | null
          related_event_title: string | null
          sort_order: number
          subject: string | null
          user_id: string
        }
        Insert: {
          apostila_id: string
          apostila_title: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          plan_date: string
          pomodoros?: number
          reason: string
          related_event_date?: string | null
          related_event_id?: string | null
          related_event_title?: string | null
          sort_order?: number
          subject?: string | null
          user_id: string
        }
        Update: {
          apostila_id?: string
          apostila_title?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          plan_date?: string
          pomodoros?: number
          reason?: string
          related_event_date?: string | null
          related_event_id?: string | null
          related_event_title?: string | null
          sort_order?: number
          subject?: string | null
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
      tira_duvidas: {
        Row: {
          concept: string | null
          created_at: string
          full_answer: string | null
          hint: string | null
          id: string
          image_path: string | null
          image_url: string
          related_apostila_id: string | null
          related_apostila_title: string | null
          similarity: number | null
          user_id: string
        }
        Insert: {
          concept?: string | null
          created_at?: string
          full_answer?: string | null
          hint?: string | null
          id?: string
          image_path?: string | null
          image_url: string
          related_apostila_id?: string | null
          related_apostila_title?: string | null
          similarity?: number | null
          user_id: string
        }
        Update: {
          concept?: string | null
          created_at?: string
          full_answer?: string | null
          hint?: string | null
          id?: string
          image_path?: string | null
          image_url?: string
          related_apostila_id?: string | null
          related_apostila_title?: string | null
          similarity?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tira_duvidas_related_apostila_id_fkey"
            columns: ["related_apostila_id"]
            isOneToOne: false
            referencedRelation: "apostilas"
            referencedColumns: ["id"]
          },
        ]
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
      weekly_simulado_answers: {
        Row: {
          answered_at: string | null
          apostila_id: string | null
          correct_answer: string
          created_at: string
          exercise_id: string | null
          explanation: string | null
          id: string
          is_correct: boolean | null
          options: Json
          question: string
          question_index: number
          selected_answer: string | null
          simulado_id: string
          subject: string | null
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          apostila_id?: string | null
          correct_answer: string
          created_at?: string
          exercise_id?: string | null
          explanation?: string | null
          id?: string
          is_correct?: boolean | null
          options?: Json
          question: string
          question_index: number
          selected_answer?: string | null
          simulado_id: string
          subject?: string | null
          user_id: string
        }
        Update: {
          answered_at?: string | null
          apostila_id?: string | null
          correct_answer?: string
          created_at?: string
          exercise_id?: string | null
          explanation?: string | null
          id?: string
          is_correct?: boolean | null
          options?: Json
          question?: string
          question_index?: number
          selected_answer?: string | null
          simulado_id?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_simulado_answers_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "weekly_simulados"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_simulados: {
        Row: {
          correct_count: number
          created_at: string
          diagnosis: Json
          finished_at: string | null
          id: string
          score: number
          started_at: string
          status: string
          total_questions: number
          user_id: string
          week_start: string
        }
        Insert: {
          correct_count?: number
          created_at?: string
          diagnosis?: Json
          finished_at?: string | null
          id?: string
          score?: number
          started_at?: string
          status?: string
          total_questions?: number
          user_id: string
          week_start: string
        }
        Update: {
          correct_count?: number
          created_at?: string
          diagnosis?: Json
          finished_at?: string | null
          id?: string
          score?: number
          started_at?: string
          status?: string
          total_questions?: number
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_badge: { Args: { _criteria: string }; Returns: Json }
      check_exercise_answer: {
        Args: { _exercise_id: string; _selected_answer: string }
        Returns: Json
      }
      count_tira_duvidas_today: { Args: { _user_id: string }; Returns: number }
      delete_user_completely: {
        Args: { _target_user_id: string }
        Returns: undefined
      }
      get_apostila_reader_tree: {
        Args: { _apostila_id: string }
        Returns: Json
      }
      get_content_scope: { Args: { _user_id: string }; Returns: string }
      get_dashboard_stats: { Args: { _user_id: string }; Returns: Json }
      get_email_for_ra: { Args: { _ra: string }; Returns: string }
      get_exercise_counts: { Args: never; Returns: Json }
      get_student_detail: { Args: { _user_id: string }; Returns: Json }
      get_student_rankings: {
        Args: { _limit?: number }
        Returns: {
          accuracy: number
          avatar_url: string
          errors: number
          full_name: string
          hits: number
          ra: string
          total: number
          user_id: string
        }[]
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
      log_user_action: {
        Args: { _action: string; _material_id?: string }
        Returns: undefined
      }
      match_apostila: {
        Args: { _embedding: string }
        Returns: {
          category: string
          id: string
          similarity: number
          title: string
        }[]
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
