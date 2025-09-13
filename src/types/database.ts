export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          profile_text: string | null
          last_feed_generated_at: string | null
        }
        Insert: {
          id: string
          created_at?: string
          profile_text?: string | null
          last_feed_generated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          profile_text?: string | null
          last_feed_generated_at?: string | null
        }
      }
      submitted_urls: {
        Row: {
          id: number
          user_id: string
          url: string | null
          created_at: string
          keywords: string | null
          profile_type: string | null
        }
        Insert: {
          id?: number
          user_id: string
          url?: string | null
          created_at?: string
          keywords?: string | null
          profile_type?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          url?: string | null
          created_at?: string
          keywords?: string | null
          profile_type?: string | null
        }
      }
      feed_items: {
        Row: {
          id: number
          user_id: string
          item_type: string
          title: string
          summary: string | null
          url: string | null
          metadata: any | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          item_type: string
          title: string
          summary?: string | null
          url?: string | null
          metadata?: any | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          item_type?: string
          title?: string
          summary?: string | null
          url?: string | null
          metadata?: any | null
          created_at?: string
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
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type SubmittedUrl = Database['public']['Tables']['submitted_urls']['Row']  
export type FeedItem = Database['public']['Tables']['feed_items']['Row']