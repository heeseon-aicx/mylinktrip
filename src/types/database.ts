// ============================================
// Supabase Database Types
// ============================================

export type LinkStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";
export type LinkStage =
  | "fetch_meta"
  | "transcribe"
  | "extract_places"
  | "summarize";
export type PlaceCategory = "TNA" | "LODGING";

// ============================================
// Database Row Types
// ============================================

export interface LinkRow {
  id: number;
  title_ai: string | null;
  title_user: string | null;
  youtube_url: string;
  youtube_video_id: string | null;
  youtube_channel_name: string | null;
  youtube_channel_id: string | null;
  status: string;
  progress_pct: number;
  stage: string | null;
  status_message: string | null;
  error_code: string | null;
  error_message: string | null;
  error_detail: Record<string, unknown> | null;
  started_at: string | null;
  finished_at: string | null;
  parsed_at: string | null;
  heartbeat_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkPlaceItemRow {
  id: number;
  link_id: number;
  place_name: string;
  category: string | null;
  timeline_start_sec: number | null;
  timeline_end_sec: number | null;
  country: string | null;
  city: string | null;
  youtuber_comment: string | null;
  user_memo: string | null;
  order_index: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// With Relations
// ============================================

export interface LinkWithPlaces extends LinkRow {
  link_place_items: LinkPlaceItemRow[];
}

// ============================================
// Insert/Update Types
// ============================================

export interface LinkInsert {
  youtube_url: string;
  youtube_video_id?: string | null;
  status?: string;
  progress_pct?: number;
  status_message?: string | null;
}

export interface LinkPlaceItemUpdate {
  user_memo?: string | null;
  order_index?: number | null;
  is_deleted?: boolean;
}

// ============================================
// Supabase Database Schema
// ============================================

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
      links: {
        Row: {
          id: number
          title_ai: string | null
          title_user: string | null
          youtube_url: string
          youtube_video_id: string | null
          youtube_channel_name: string | null
          youtube_channel_id: string | null
          status: string
          progress_pct: number
          stage: string | null
          status_message: string | null
          error_code: string | null
          error_message: string | null
          error_detail: Json | null
          started_at: string | null
          finished_at: string | null
          parsed_at: string | null
          heartbeat_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title_ai?: string | null
          title_user?: string | null
          youtube_url: string
          youtube_video_id?: string | null
          youtube_channel_name?: string | null
          youtube_channel_id?: string | null
          status?: string
          progress_pct?: number
          stage?: string | null
          status_message?: string | null
          error_code?: string | null
          error_message?: string | null
          error_detail?: Json | null
          started_at?: string | null
          finished_at?: string | null
          parsed_at?: string | null
          heartbeat_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title_ai?: string | null
          title_user?: string | null
          youtube_url?: string
          youtube_video_id?: string | null
          youtube_channel_name?: string | null
          youtube_channel_id?: string | null
          status?: string
          progress_pct?: number
          stage?: string | null
          status_message?: string | null
          error_code?: string | null
          error_message?: string | null
          error_detail?: Json | null
          started_at?: string | null
          finished_at?: string | null
          parsed_at?: string | null
          heartbeat_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      link_place_items: {
        Row: {
          id: number
          link_id: number
          place_name: string
          category: string | null
          timeline_start_sec: number | null
          timeline_end_sec: number | null
          country: string | null
          city: string | null
          youtuber_comment: string | null
          user_memo: string | null
          order_index: number | null
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          link_id: number
          place_name: string
          category?: string | null
          timeline_start_sec?: number | null
          timeline_end_sec?: number | null
          country?: string | null
          city?: string | null
          youtuber_comment?: string | null
          user_memo?: string | null
          order_index?: number | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          link_id?: number
          place_name?: string
          category?: string | null
          timeline_start_sec?: number | null
          timeline_end_sec?: number | null
          country?: string | null
          city?: string | null
          youtuber_comment?: string | null
          user_memo?: string | null
          order_index?: number | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_place_items_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ============================================
// Type Guards & Helpers
// ============================================

export function isLinkRow(data: unknown): data is LinkRow {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "youtube_url" in data &&
    "status" in data
  );
}

export function isLinkPlaceItemRow(data: unknown): data is LinkPlaceItemRow {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "link_id" in data &&
    "place_name" in data
  );
}

export function isLinkWithPlaces(data: unknown): data is LinkWithPlaces {
  return (
    isLinkRow(data) &&
    "link_place_items" in data &&
    Array.isArray((data as LinkWithPlaces).link_place_items)
  );
}

export function toLinkRow(data: unknown): LinkRow {
  if (!isLinkRow(data)) {
    throw new Error("Invalid LinkRow data");
  }
  return data;
}

export function toLinkPlaceItemRow(data: unknown): LinkPlaceItemRow {
  if (!isLinkPlaceItemRow(data)) {
    throw new Error("Invalid LinkPlaceItemRow data");
  }
  return data;
}

export function toLinkWithPlaces(data: unknown): LinkWithPlaces {
  if (!isLinkWithPlaces(data)) {
    throw new Error("Invalid LinkWithPlaces data");
  }
  return data;
}
