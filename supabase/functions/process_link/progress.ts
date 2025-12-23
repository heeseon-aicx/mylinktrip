import "./deno.d.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type LinkStage = "fetch_meta" | "extract_places" | "persist";

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
    })
    .eq("id", linkId);

  if (error) {
    console.error(`[progress] Complete update failed for link ${linkId}:`, error);
  }
}

