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
      clients: {
        Row: {
          company: string
          contact: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          plan: string | null
          status: Database["public"]["Enums"]["client_status"]
        }
        Insert: {
          company: string
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          plan?: string | null
          status?: Database["public"]["Enums"]["client_status"]
        }
        Update: {
          company?: string
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          plan?: string | null
          status?: Database["public"]["Enums"]["client_status"]
        }
        Relationships: []
      }
      demand_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          demand_id: string
          id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          demand_id: string
          id?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          demand_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_comments_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_history: {
        Row: {
          action: string
          actor_id: string
          at: string
          demand_id: string
          id: string
        }
        Insert: {
          action: string
          actor_id: string
          at?: string
          demand_id: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string
          at?: string
          demand_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_history_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      demands: {
        Row: {
          assignee_id: string | null
          briefing: string | null
          client_id: string | null
          created_at: string
          created_by_id: string
          deadline: string | null
          id: string
          internal_notes: string | null
          links: Json
          position: number
          priority: Database["public"]["Enums"]["demand_priority"]
          sector: Database["public"]["Enums"]["sector"]
          status: Database["public"]["Enums"]["demand_status"]
          title: string
          type: Database["public"]["Enums"]["demand_type"]
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          briefing?: string | null
          client_id?: string | null
          created_at?: string
          created_by_id: string
          deadline?: string | null
          id?: string
          internal_notes?: string | null
          links?: Json
          position?: number
          priority?: Database["public"]["Enums"]["demand_priority"]
          sector: Database["public"]["Enums"]["sector"]
          status?: Database["public"]["Enums"]["demand_status"]
          title: string
          type?: Database["public"]["Enums"]["demand_type"]
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          briefing?: string | null
          client_id?: string | null
          created_at?: string
          created_by_id?: string
          deadline?: string | null
          id?: string
          internal_notes?: string | null
          links?: Json
          position?: number
          priority?: Database["public"]["Enums"]["demand_priority"]
          sector?: Database["public"]["Enums"]["sector"]
          status?: Database["public"]["Enums"]["demand_status"]
          title?: string
          type?: Database["public"]["Enums"]["demand_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demands_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          client_id: string | null
          color: string | null
          created_at: string
          date: string | null
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          meeting_link: string | null
          note_id: string | null
          priority: string
          project_id: string | null
          reminders: Json
          start_time: string | null
          task_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          client_id?: string | null
          color?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          meeting_link?: string | null
          note_id?: string | null
          priority?: string
          project_id?: string | null
          reminders?: Json
          start_time?: string | null
          task_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          client_id?: string | null
          color?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          meeting_link?: string | null
          note_id?: string | null
          priority?: string
          project_id?: string | null
          reminders?: Json
          start_time?: string | null
          task_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "freelancer_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      freelancer_clients: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          instagram: string | null
          name: string
          niche: string | null
          notes: string | null
          site: string | null
          status: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          name: string
          niche?: string | null
          notes?: string | null
          site?: string | null
          status?: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          name?: string
          niche?: string | null
          notes?: string | null
          site?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          pinned: boolean
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          demand_id: string | null
          id: string
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          demand_id?: string | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          demand_id?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          bio: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["member_status"]
          theme: string
          weekly_goal: number
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["member_status"]
          theme?: string
          weekly_goal?: number
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["member_status"]
          theme?: string
          weekly_goal?: number
        }
        Relationships: []
      }
      projects: {
        Row: {
          client: string | null
          client_id: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client?: string | null
          client_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client?: string | null
          client_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "freelancer_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string
          client_id: string | null
          completed: boolean
          created_at: string
          date: string | null
          description: string | null
          end_time: string | null
          id: string
          priority: string
          project_id: string | null
          start_time: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          client_id?: string | null
          completed?: boolean
          created_at?: string
          date?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          client_id?: string | null
          completed?: boolean
          created_at?: string
          date?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "freelancer_clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          _demand_id?: string
          _message: string
          _title: string
          _type: Database["public"]["Enums"]["notification_type"]
          _user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      client_status: "ativo" | "pausado" | "encerrado"
      demand_priority: "baixa" | "media" | "alta" | "urgente"
      demand_status:
        | "a_fazer"
        | "em_andamento"
        | "revisao"
        | "ajustes"
        | "finalizado"
      demand_type:
        | "post_estatico"
        | "carrossel"
        | "reels"
        | "stories"
        | "copy"
        | "planejamento"
        | "roteiro"
        | "captacao"
        | "edicao_video"
        | "identidade_visual"
        | "landing_page"
        | "outro"
      member_status: "ativo" | "inativo"
      notification_type:
        | "assigned"
        | "to_review"
        | "approved"
        | "needs_adjustment"
        | "deadline_close"
        | "new_comment"
        | "completed"
      sector:
        | "social_media"
        | "audiovisual"
        | "design"
        | "planejamento"
        | "copy"
        | "diretoria"
      user_role:
        | "diretor"
        | "social_media"
        | "designer_grafico"
        | "designer_web"
        | "videomaker"
        | "copywriter"
        | "lider"
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
      client_status: ["ativo", "pausado", "encerrado"],
      demand_priority: ["baixa", "media", "alta", "urgente"],
      demand_status: [
        "a_fazer",
        "em_andamento",
        "revisao",
        "ajustes",
        "finalizado",
      ],
      demand_type: [
        "post_estatico",
        "carrossel",
        "reels",
        "stories",
        "copy",
        "planejamento",
        "roteiro",
        "captacao",
        "edicao_video",
        "identidade_visual",
        "landing_page",
        "outro",
      ],
      member_status: ["ativo", "inativo"],
      notification_type: [
        "assigned",
        "to_review",
        "approved",
        "needs_adjustment",
        "deadline_close",
        "new_comment",
        "completed",
      ],
      sector: [
        "social_media",
        "audiovisual",
        "design",
        "planejamento",
        "copy",
        "diretoria",
      ],
      user_role: [
        "diretor",
        "social_media",
        "designer_grafico",
        "designer_web",
        "videomaker",
        "copywriter",
        "lider",
      ],
    },
  },
} as const
