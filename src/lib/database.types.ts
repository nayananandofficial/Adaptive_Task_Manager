export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'student' | 'teacher' | 'writer' | 'freelancer' | 'project_manager'
          onboarded: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role: 'student' | 'teacher' | 'writer' | 'freelancer' | 'project_manager'
          onboarded?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'teacher' | 'writer' | 'freelancer' | 'project_manager'
          onboarded?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      boards: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          color: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          color?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          color?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      lists: {
        Row: {
          id: string
          board_id: string
          title: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          title: string
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          title?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      cards: {
        Row: {
          id: string
          list_id: string
          title: string
          description: string | null
          due_date: string | null
          position: number
          labels: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          title: string
          description?: string | null
          due_date?: string | null
          position?: number
          labels?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          position?: number
          labels?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      subtasks: {
        Row: {
          id: string
          card_id: string
          title: string
          completed: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          card_id: string
          title: string
          completed?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          card_id?: string
          title?: string
          completed?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          title: string
          description: string | null
          role: 'student' | 'teacher' | 'writer' | 'freelancer' | 'project_manager' | 'general'
          template_data: Json
          is_public: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          role: 'student' | 'teacher' | 'writer' | 'freelancer' | 'project_manager' | 'general'
          template_data: Json
          is_public?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          role?: 'student' | 'teacher' | 'writer' | 'freelancer' | 'project_manager' | 'general'
          template_data?: Json
          is_public?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'student' | 'teacher' | 'writer' | 'freelancer' | 'project_manager'
    }
  }
}