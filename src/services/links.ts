import { createClient } from "@/lib/supabase/client";
import type {
  LinkRow,
  LinkPlaceItemRow,
  LinkInsert,
  LinkPlaceItemUpdate,
} from "@/types/database";

// ============================================
// Types
// ============================================

export interface LinkWithItems extends LinkRow {
  link_place_items: LinkPlaceItemRow[];
}

export interface CreateLinkParams {
  youtube_url: string;
}

export interface UpdateItemParams {
  user_memo?: string | null;
  order_index?: number;
  is_deleted?: boolean;
}

export interface ReorderItemParams {
  id: number;
  order_index: number;
}

// ============================================
// API Functions
// ============================================

const supabase = createClient();

/**
 * 링크 생성 (유튜브 URL 입력)
 */
export async function createLink(params: CreateLinkParams): Promise<LinkRow> {
  // 유튜브 video_id 추출
  const videoId = extractYoutubeVideoId(params.youtube_url);

  const insertData: LinkInsert = {
    youtube_url: params.youtube_url,
    youtube_video_id: videoId,
    status: "PENDING",
    progress_pct: 0,
    status_message: "분석 대기 중...",
  };

  const { data, error } = await supabase
    .from("links")
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 링크 상세 조회 (장소 아이템 포함)
 */
export async function getLink(linkId: number): Promise<LinkWithItems> {
  const { data, error } = await supabase
    .from("links")
    .select(`
      *,
      link_place_items (*)
    `)
    .eq("id", linkId)
    .single();

  if (error) throw error;

  // items 정렬 및 삭제된 것 필터링
  return {
    ...data,
    link_place_items: (data.link_place_items || [])
      .filter((item: LinkPlaceItemRow) => !item.is_deleted)
      .sort((a: LinkPlaceItemRow, b: LinkPlaceItemRow) => 
        (a.order_index ?? 0) - (b.order_index ?? 0)
      ),
  };
}

/**
 * 링크 상태만 조회 (폴링용, 가벼움)
 */
export async function getLinkStatus(linkId: number): Promise<Pick<LinkRow, "id" | "status" | "progress_pct" | "stage" | "status_message">> {
  const { data, error } = await supabase
    .from("links")
    .select("id, status, progress_pct, stage, status_message")
    .eq("id", linkId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * 장소 아이템 수정 (메모, 순서, 삭제)
 */
export async function updateLinkItem(
  itemId: number,
  params: UpdateItemParams
): Promise<LinkPlaceItemRow> {
  const updateData: LinkPlaceItemUpdate = {};

  if (params.user_memo !== undefined) updateData.user_memo = params.user_memo;
  if (params.order_index !== undefined) updateData.order_index = params.order_index;
  if (params.is_deleted !== undefined) updateData.is_deleted = params.is_deleted;

  const { data, error } = await supabase
    .from("link_place_items")
    .update(updateData)
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 장소 아이템 삭제 (soft delete)
 */
export async function deleteLinkItem(itemId: number): Promise<void> {
  const { error } = await supabase
    .from("link_place_items")
    .update({ is_deleted: true })
    .eq("id", itemId);

  if (error) throw error;
}

/**
 * 장소 순서 일괄 변경
 */
export async function reorderLinkItems(
  linkId: number,
  items: ReorderItemParams[]
): Promise<void> {
  // 트랜잭션 대신 순차 업데이트 (Supabase 무료 플랜)
  const updates = items.map((item) =>
    supabase
      .from("link_place_items")
      .update({ order_index: item.order_index })
      .eq("id", item.id)
      .eq("link_id", linkId)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error);

  if (errors.length > 0) {
    throw new Error("Failed to reorder items");
  }
}

// ============================================
// Helpers
// ============================================

/**
 * 유튜브 URL에서 video_id 추출
 */
export function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * 초를 "3:08" 형식으로 변환
 */
export function formatTimestamp(seconds: number | null): string {
  if (seconds === null) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * 유튜브 타임스탬프 링크 생성
 */
export function getYoutubeTimestampUrl(videoId: string, seconds: number): string {
  return `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`;
}

/**
 * 마이리얼트립 검색 URL 생성
 */
export function getMrtSearchUrl(
  placeName: string,
  city: string | null,
  category: string | null
): string {
  const type = category === "LODGING" ? "accommodations" : "tna";
  const query = encodeURIComponent(`${city || ""} ${placeName}`.trim());
  return `https://www.myrealtrip.com/${type}?search=${query}`;
}



