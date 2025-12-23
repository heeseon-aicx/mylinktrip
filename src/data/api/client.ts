import type { DataSource } from "../datasource";
import type {
  LinkDetailResponse,
  CreateLinkResponse,
  UpdateItemRequest,
  UpdateItemResponse,
  ReorderRequest,
  ReorderResponse,
  ApiError,
} from "../types";

// ============================================
// API Client Configuration
// ============================================

const API_BASE_URL = "/api";

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as ApiError;
    throw new Error(error.error?.message || "API 요청 실패");
  }

  return data as T;
}

// ============================================
// Real API Implementation
// ============================================

export const realApi: DataSource = {
  /**
   * 링크 생성
   */
  async createLink(youtubeUrl: string): Promise<CreateLinkResponse> {
    const data = await fetchApi<CreateLinkResponse>("/links", {
      method: "POST",
      body: JSON.stringify({ youtube_url: youtubeUrl }),
    });

    return { id: data.id };
  },

  /**
   * 링크 상세 조회 (items 포함)
   */
  async getLinkDetail(linkId: number): Promise<LinkDetailResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await fetchApi<any>(`/links/${linkId}`);

    // API 응답: link_place_items → 프론트엔드: items 로 변환
    return {
      id: data.id,
      youtube_url: data.youtube_url,
      youtube_video_id: data.youtube_video_id,
      youtube_channel_name: data.youtube_channel_name,
      youtube_channel_id: data.youtube_channel_id,
      title_ai: data.title_ai,
      title_user: data.title_user,
      status: data.status,
      progress_pct: data.progress_pct,
      stage: data.stage,
      status_message: data.status_message,
      error_code: data.error_code,
      error_message: data.error_message,
      created_at: data.created_at,
      updated_at: data.updated_at,
      items: (data.link_place_items || data.items || []).map((item: LinkDetailResponse["items"][0]) => ({
        ...item,
        order_index: item.order_index ?? 0,
      })),
    };
  },

  /**
   * 장소 카드 수정 (메모/삭제)
   */
  async updateItem(
    linkId: number,
    itemId: number,
    patch: UpdateItemRequest
  ): Promise<UpdateItemResponse> {
    return fetchApi<UpdateItemResponse>(`/links/${linkId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  /**
   * 장소 카드 순서 변경
   */
  async reorderItems(
    linkId: number,
    payload: ReorderRequest
  ): Promise<ReorderResponse> {
    return fetchApi<ReorderResponse>(`/links/${linkId}/items/reorder`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};

