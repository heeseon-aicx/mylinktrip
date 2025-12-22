// ============================================
// Supabase Database Types
// ============================================

export type LinkStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
export type LinkStage = 'fetch_meta' | 'transcribe' | 'extract_places' | 'summarize';
export type PlaceCategory = 'TNA' | 'LODGING';

// ============================================
// Database Row Types (DB에서 가져온 그대로)
// ============================================

export interface LinkRow {
  id: number;
  
  // 제목
  title_ai: string | null;
  title_user: string | null;
  
  // 유튜브 메타
  youtube_url: string;
  youtube_video_id: string | null;
  youtube_channel_name: string | null;
  youtube_channel_id: string | null;
  
  // 실시간 상태
  status: LinkStatus;
  progress_pct: number;
  stage: LinkStage | null;
  status_message: string | null;
  
  // 에러 정보
  error_code: string | null;
  error_message: string | null;
  error_detail: Record<string, unknown> | null;
  
  // 타임스탬프
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
  category: PlaceCategory | null;
  
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
// Insert Types (생성 시 사용)
// ============================================

export interface LinkInsert {
  youtube_url: string;
  title_ai?: string | null;
  title_user?: string | null;
  youtube_video_id?: string | null;
  youtube_channel_name?: string | null;
  youtube_channel_id?: string | null;
  status?: LinkStatus;
  progress_pct?: number;
  stage?: LinkStage | null;
  status_message?: string | null;
}

export interface LinkPlaceItemInsert {
  link_id: number;
  place_name: string;
  category?: PlaceCategory | null;
  timeline_start_sec?: number | null;
  timeline_end_sec?: number | null;
  country?: string | null;
  city?: string | null;
  youtuber_comment?: string | null;
  user_memo?: string | null;
  order_index?: number | null;
}

// ============================================
// Update Types (수정 시 사용)
// ============================================

export interface LinkUpdate {
  title_ai?: string | null;
  title_user?: string | null;
  youtube_video_id?: string | null;
  youtube_channel_name?: string | null;
  youtube_channel_id?: string | null;
  status?: LinkStatus;
  progress_pct?: number;
  stage?: LinkStage | null;
  status_message?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  error_detail?: Record<string, unknown> | null;
  started_at?: string | null;
  finished_at?: string | null;
  parsed_at?: string | null;
  heartbeat_at?: string | null;
}

export interface LinkPlaceItemUpdate {
  user_memo?: string | null;      // ✏️ 사용자 편집 가능
  order_index?: number | null;    // ✏️ 순서 변경 가능
  is_deleted?: boolean;           // ✏️ 삭제 가능
}

// ============================================
// With Relations (조인된 데이터)
// ============================================

export interface LinkWithPlaces extends LinkRow {
  link_place_items: LinkPlaceItemRow[];
}

// ============================================
// Supabase Database Schema
// ============================================

export interface Database {
  public: {
    Tables: {
      links: {
        Row: LinkRow;
        Insert: LinkInsert;
        Update: LinkUpdate;
      };
      link_place_items: {
        Row: LinkPlaceItemRow;
        Insert: LinkPlaceItemInsert;
        Update: LinkPlaceItemUpdate;
      };
    };
  };
}



