import "./deno.d.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GeminiPlace } from "./gemini.ts";

type LinkStage = "fetch_meta" | "extract_places" | "persist";

export interface ChunkResult {
  chunkIndex: number;
  places: GeminiPlace[];
}

/**
 * 진행 상태 업데이트
 */
export async function updateProgress(
  supabase: SupabaseClient,
  linkId: number,
  progressPct: number,
  stage: LinkStage,
  statusMessage: string
): Promise<void> {
  const { error } = await supabase
    .from("links")
    .update({
      progress_pct: progressPct,
      stage,
      status_message: statusMessage,
      heartbeat_at: new Date().toISOString(),
    })
    .eq("id", linkId);

  if (error) {
    console.error(`[progress] Update failed for link ${linkId}:`, error);
  }
}

/**
 * 청크 처리 진행 상태 저장 (Self-Continuation용)
 */
export async function saveChunkProgress(
  supabase: SupabaseClient,
  linkId: number,
  currentChunkIndex: number,
  totalChunks: number,
  chunkResults: ChunkResult[]
): Promise<void> {
  const progressPct = Math.floor(30 + (currentChunkIndex / totalChunks) * 50); // 30~80% 범위

  const { error } = await supabase
    .from("links")
    .update({
      current_chunk_index: currentChunkIndex,
      total_chunks: totalChunks,
      chunk_results: chunkResults,
      progress_pct: progressPct,
      status_message: `장소 추출 중... (${currentChunkIndex + 1}/${totalChunks} 구간)`,
      heartbeat_at: new Date().toISOString(),
    })
    .eq("id", linkId);

  if (error) {
    console.error(`[progress] Save chunk progress failed for link ${linkId}:`, error);
  }
}

/**
 * 기존 청크 결과 로드 (재개 시 사용)
 */
export async function loadChunkProgress(
  supabase: SupabaseClient,
  linkId: number
): Promise<{
  currentChunkIndex: number;
  totalChunks: number;
  chunkResults: ChunkResult[];
} | null> {
  const { data, error } = await supabase
    .from("links")
    .select("current_chunk_index, total_chunks, chunk_results")
    .eq("id", linkId)
    .single();

  if (error || !data) {
    console.error(`[progress] Load chunk progress failed for link ${linkId}:`, error);
    return null;
  }

  return {
    currentChunkIndex: data.current_chunk_index ?? 0,
    totalChunks: data.total_chunks ?? 0,
    chunkResults: (data.chunk_results as ChunkResult[]) ?? [],
  };
}

/**
 * 실패 처리
 */
export async function failLink(
  supabase: SupabaseClient,
  linkId: number,
  errorCode: string,
  errorMessage: string,
  errorDetail?: unknown
): Promise<void> {
  console.error(`[progress] Link ${linkId} failed: ${errorCode} - ${errorMessage}`);
  
  const { error } = await supabase
    .from("links")
    .update({
      status: "FAILED",
      error_code: errorCode,
      error_message: errorMessage,
      error_detail: errorDetail ? JSON.parse(JSON.stringify(errorDetail)) : null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", linkId);

  if (error) {
    console.error(`[progress] Fail update failed for link ${linkId}:`, error);
  }
}

/**
 * 완료 처리
 */
export async function completeLink(
  supabase: SupabaseClient,
  linkId: number,
  titleAi: string
): Promise<void> {
  const now = new Date().toISOString();
  
  const { error } = await supabase
    .from("links")
    .update({
      status: "READY",
      progress_pct: 100,
      stage: null,
      status_message: null,
      title_ai: titleAi,
      parsed_at: now,
      finished_at: now,
      // 청크 관련 필드 초기화
      chunk_results: [],
    })
    .eq("id", linkId);

  if (error) {
    console.error(`[progress] Complete update failed for link ${linkId}:`, error);
  }
}

/**
 * 청크 결과를 link_place_items에 저장
 */
export async function saveItemsFromChunks(
  supabase: SupabaseClient,
  linkId: number,
  places: GeminiPlace[]
): Promise<boolean> {
  // 기존 items soft delete
  await supabase
    .from("link_place_items")
    .update({ is_deleted: true })
    .eq("link_id", linkId);

  // 새 items 저장
  const items = places.map((place, idx) => ({
    link_id: linkId,
    place_name: place.place_name,
    category: place.category || null,
    timeline_start_sec: place.timeline_start_sec ?? null,
    timeline_end_sec: place.timeline_end_sec ?? null,
    country: place.country || null,
    city: place.city || null,
    youtuber_comment: place.youtuber_comment || null,
    order_index: (idx + 1) * 10,
  }));

  const { error: insertError } = await supabase
    .from("link_place_items")
    .insert(items);

  if (insertError) {
    console.error(`[progress] Insert items failed:`, insertError);
    return false;
  }

  console.log(`[progress] Saved ${items.length} items for link ${linkId}`);
  return true;
}

