// ============================================
// 기본 타입 정의
// ============================================

export type LinkStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";
export type LinkStage =
  | "fetch_meta"
  | "transcribe"
  | "extract_places"
  | "summarize";
export type PlaceCategory = "TNA" | "LODGING";

// ============================================
// Entity Types
// ============================================

export interface LinkItem {
  id: number;
  link_id: number;
  place_name: string;
  category: PlaceCategory | null;
  country: string | null;
  city: string | null;
  timeline_start_sec: number | null;
  timeline_end_sec: number | null;
  youtuber_comment: string | null;
  user_memo: string | null;
  order_index: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: number;
  youtube_url: string;
  youtube_video_id: string | null;
  youtube_channel_name: string | null;
  youtube_channel_id: string | null;
  title_ai: string | null;
  title_user: string | null;
  status: LinkStatus;
  progress_pct: number;
  stage: LinkStage | null;
  status_message: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  items?: LinkItem[];
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateLinkRequest {
  youtube_url: string;
}

export interface CreateLinkResponse {
  id: number;
}

export interface LinkDetailResponse extends Link {
  items: LinkItem[];
}

export interface UpdateItemRequest {
  user_memo?: string | null;
  is_deleted?: boolean;
}

export interface UpdateItemResponse {
  id: number;
  place_name: string;
  user_memo: string | null;
  order_index: number;
  is_deleted: boolean;
  updated_at: string;
}

export interface ReorderRequest {
  item_orders: { id: number; order_index: number }[];
}

export interface ReorderResponse {
  success: boolean;
  updated_count: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// ============================================
// 진행 상태 정의
// ============================================

export interface ProgressState {
  status: LinkStatus;
  progress_pct: number;
  stage: LinkStage | null;
  status_message: string;
}

export const PROGRESS_STATES: ProgressState[] = [
  {
    status: "PENDING",
    progress_pct: 0,
    stage: null,
    status_message: "분석 대기 중...",
  },
  {
    status: "PROCESSING",
    progress_pct: 10,
    stage: "fetch_meta",
    status_message: "영상 정보 가져오는 중...",
  },
  {
    status: "PROCESSING",
    progress_pct: 30,
    stage: "transcribe",
    status_message: "자막 추출 중...",
  },
  {
    status: "PROCESSING",
    progress_pct: 50,
    stage: "transcribe",
    status_message: "자막 분석 중...",
  },
  {
    status: "PROCESSING",
    progress_pct: 70,
    stage: "extract_places",
    status_message: "장소 추출 중...",
  },
  {
    status: "PROCESSING",
    progress_pct: 85,
    stage: "extract_places",
    status_message: "장소 정보 정리 중...",
  },
  {
    status: "PROCESSING",
    progress_pct: 95,
    stage: "summarize",
    status_message: "여행 계획 생성 중...",
  },
  {
    status: "READY",
    progress_pct: 100,
    stage: null,
    status_message: "분석 완료!",
  },
];

