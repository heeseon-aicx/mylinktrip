// ============================================
// Types
// ============================================

export type LinkStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";
export type LinkStage =
  | "fetch_meta"
  | "transcribe"
  | "extract_places"
  | "summarize";
export type PlaceCategory = "TNA" | "LODGING";

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
// API Response Types
// ============================================

export interface CreateLinkResponse {
  id: number;
  youtube_url: string;
  youtube_video_id: string | null;
  status: "PENDING";
  progress_pct: 0;
  created_at: string;
}

export interface LinkDetailResponse extends Link {
  items: LinkItem[];
}

export interface UpdateItemRequest {
  user_memo?: string | null;
  order_index?: number;
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
// Dummy Data
// ============================================

export const MOCK_LINK_PENDING: Link = {
  id: 1,
  youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  youtube_video_id: "dQw4w9WgXcQ",
  youtube_channel_name: null,
  youtube_channel_id: null,
  title_ai: null,
  title_user: null,
  status: "PENDING",
  progress_pct: 0,
  stage: null,
  status_message: "분석 대기 중...",
  error_code: null,
  error_message: null,
  created_at: "2024-12-22T10:00:00Z",
  updated_at: "2024-12-22T10:00:00Z",
};

export const MOCK_LINK_PROCESSING: Link = {
  id: 1,
  youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  youtube_video_id: "dQw4w9WgXcQ",
  youtube_channel_name: "여행에미치다",
  youtube_channel_id: "UC1234567890",
  title_ai: null,
  title_user: null,
  status: "PROCESSING",
  progress_pct: 40,
  stage: "transcribe",
  status_message: "자막 추출 중...",
  error_code: null,
  error_message: null,
  created_at: "2024-12-22T10:00:00Z",
  updated_at: "2024-12-22T10:00:30Z",
};

export const MOCK_LINK_READY_TOKYO: LinkDetailResponse = {
  id: 1,
  youtube_url: "https://www.youtube.com/watch?v=tokyo123",
  youtube_video_id: "tokyo123",
  youtube_channel_name: "여행에미치다",
  youtube_channel_id: "UC1234567890",
  title_ai: "도쿄 3박4일 완벽 가이드 🗼 맛집 & 관광지 총정리",
  title_user: null,
  status: "READY",
  progress_pct: 100,
  stage: null,
  status_message: "분석 완료!",
  error_code: null,
  error_message: null,
  created_at: "2024-12-22T10:00:00Z",
  updated_at: "2024-12-22T10:02:00Z",
  items: [
    {
      id: 1,
      link_id: 1,
      place_name: "이치란 라멘 시부야점",
      category: "TNA",
      country: "일본",
      city: "도쿄",
      timeline_start_sec: 125,
      timeline_end_sec: 180,
      youtuber_comment: "웨이팅 1시간은 각오하세요! 근데 그만큼 맛있어요",
      user_memo: null,
      order_index: 0,
      is_deleted: false,
      created_at: "2024-12-22T10:02:00Z",
      updated_at: "2024-12-22T10:02:00Z",
    },
    {
      id: 2,
      link_id: 1,
      place_name: "시부야 스카이",
      category: "TNA",
      country: "일본",
      city: "도쿄",
      timeline_start_sec: 320,
      timeline_end_sec: 410,
      youtuber_comment: "일몰 시간 맞춰서 가면 야경까지 볼 수 있어요",
      user_memo: null,
      order_index: 1,
      is_deleted: false,
      created_at: "2024-12-22T10:02:00Z",
      updated_at: "2024-12-22T10:02:00Z",
    },
    {
      id: 3,
      link_id: 1,
      place_name: "츠키지 시장",
      category: "TNA",
      country: "일본",
      city: "도쿄",
      timeline_start_sec: 542,
      timeline_end_sec: 620,
      youtuber_comment: "아침 일찍 가야 신선한 해산물 먹을 수 있어요",
      user_memo: "아침 7시 오픈!",
      order_index: 2,
      is_deleted: false,
      created_at: "2024-12-22T10:02:00Z",
      updated_at: "2024-12-22T10:05:00Z",
    },
    {
      id: 4,
      link_id: 1,
      place_name: "teamLab Planets",
      category: "TNA",
      country: "일본",
      city: "도쿄",
      timeline_start_sec: 780,
      timeline_end_sec: 890,
      youtuber_comment: "인생샷 건질 수 있는 곳! 예약 필수",
      user_memo: null,
      order_index: 3,
      is_deleted: false,
      created_at: "2024-12-22T10:02:00Z",
      updated_at: "2024-12-22T10:02:00Z",
    },
    {
      id: 5,
      link_id: 1,
      place_name: "호텔 그라피 네즈",
      category: "LODGING",
      country: "일본",
      city: "도쿄",
      timeline_start_sec: 1050,
      timeline_end_sec: 1120,
      youtuber_comment: "가성비 최고! 역에서 5분 거리",
      user_memo: null,
      order_index: 4,
      is_deleted: false,
      created_at: "2024-12-22T10:02:00Z",
      updated_at: "2024-12-22T10:02:00Z",
    },
  ],
};

export const MOCK_LINK_FAILED: Link = {
  id: 3,
  youtube_url: "https://www.youtube.com/watch?v=private123",
  youtube_video_id: "private123",
  youtube_channel_name: null,
  youtube_channel_id: null,
  title_ai: null,
  title_user: null,
  status: "FAILED",
  progress_pct: 10,
  stage: "fetch_meta",
  status_message: "영상을 불러올 수 없습니다",
  error_code: "YT_FETCH_FAILED",
  error_message: "비공개 영상이거나 삭제된 영상입니다",
  created_at: "2024-12-22T09:00:00Z",
  updated_at: "2024-12-22T09:00:15Z",
};

// 진행 상태 시뮬레이션
export const MOCK_PROGRESS_STATES: Partial<Link>[] = [
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

// ============================================
// Helpers
// ============================================

export function formatTimestamp(seconds: number | null): string {
  if (seconds === null) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getYoutubeTimestampUrl(
  videoId: string,
  seconds: number
): string {
  return `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`;
}

export function getMrtSearchUrl(
  placeName: string,
  city: string,
  category: PlaceCategory
): string {
  const type = category === "LODGING" ? "accommodations" : "tna";
  const query = encodeURIComponent(`${city} ${placeName}`);
  return `https://www.myrealtrip.com/${type}?search=${query}`;
}


