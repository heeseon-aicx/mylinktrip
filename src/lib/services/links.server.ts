import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  LinkRow,
  LinkPlaceItemRow,
  LinkWithPlaces,
  toLinkRow,
  toLinkPlaceItemRow,
  toLinkWithPlaces,
} from "@/types/database";

// ============================================
// Types
// ============================================

export type { LinkWithPlaces as LinkWithItems };

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
// Link CRUD
// ============================================

/**
 * 링크 생성 (유튜브 URL 입력)
 */
export async function createLink(params: CreateLinkParams): Promise<LinkRow> {
  const supabase = await createClient();
  const videoId = extractYoutubeVideoId(params.youtube_url);

  const { data, error } = await supabase
    .from("links")
    .insert({
      youtube_url: params.youtube_url,
      youtube_video_id: videoId,
      status: "PENDING",
      progress_pct: 0,
      status_message: "분석 대기 중...",
    })
    .select()
    .single();

  if (error) throw error;

  const link = toLinkRow(data);

  // Edge Function 호출 (비동기, 결과 기다리지 않음)
  invokeProcessLink(link.id).catch((err) => {
    console.error("Failed to invoke process_link:", err);
  });

  return link;
}

/**
 * Edge Function 호출 (process_link)
 * Admin client 사용 (service_role key 필요)
 */
async function invokeProcessLink(linkId: number): Promise<void> {
  const supabase = createAdminClient();
  
  const { error } = await supabase.functions.invoke("process_link", {
    body: { link_id: linkId },
  });

  if (error) {
    console.error("Edge function invocation error:", error);
    throw error;
  }
}

/**
 * 링크 상세 조회 (장소 아이템 포함)
 */
export async function getLink(linkId: number): Promise<LinkWithPlaces | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("links")
    .select(
      `
      *,
      link_place_items (*)
    `
    )
    .eq("id", linkId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  if (!data) return null;

  // 타입 가드로 변환
  const linkData = toLinkWithPlaces(data);

  return {
    ...linkData,
    link_place_items: linkData.link_place_items
      .filter((item) => !item.is_deleted)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
  };
}

/**
 * 링크 상태만 조회 (폴링용)
 */
export async function getLinkStatus(
  linkId: number
): Promise<Pick<
  LinkRow,
  "id" | "status" | "progress_pct" | "stage" | "status_message"
> | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("links")
    .select("id, status, progress_pct, stage, status_message")
    .eq("id", linkId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    status: data.status,
    progress_pct: data.progress_pct,
    stage: data.stage,
    status_message: data.status_message,
  };
}

// ============================================
// LinkItem CRUD
// ============================================

/**
 * 장소 아이템 단일 조회
 */
export async function getLinkItem(
  itemId: number
): Promise<LinkPlaceItemRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("link_place_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  if (!data) return null;

  return toLinkPlaceItemRow(data);
}

/**
 * 장소 아이템 수정 (메모, 순서, 삭제)
 */
export async function updateLinkItem(
  itemId: number,
  params: UpdateItemParams
): Promise<LinkPlaceItemRow> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (params.user_memo !== undefined) updateData.user_memo = params.user_memo;
  if (params.order_index !== undefined)
    updateData.order_index = params.order_index;
  if (params.is_deleted !== undefined)
    updateData.is_deleted = params.is_deleted;

  const { data, error } = await supabase
    .from("link_place_items")
    .update(updateData)
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;

  return toLinkPlaceItemRow(data);
}

/**
 * 장소 아이템 삭제 (soft delete)
 */
export async function deleteLinkItem(itemId: number): Promise<void> {
  const supabase = await createClient();

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
): Promise<{ success: boolean; updated_count: number }> {
  const supabase = await createClient();

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

  return { success: true, updated_count: items.length };
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
 * 유튜브 URL 유효성 검사
 */
export function isValidYoutubeUrl(url: string): boolean {
  return extractYoutubeVideoId(url) !== null;
}
