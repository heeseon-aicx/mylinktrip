import "./deno.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractVideoId, fetchYouTubeMeta } from "./youtube.ts";
import { createChunks, analyzeChunk, mergeChunkResults, ChunkInfo } from "./gemini.ts";
import {
  updateProgress,
  saveChunkProgress,
  loadChunkProgress,
  failLink,
  completeLink,
  saveItemsFromChunks,
  ChunkResult,
} from "./progress.ts";
import { validatePlaces } from "./validate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 120초 후 자기 호출 (30초 여유 확보)
const MAX_EXECUTION_TIME_MS = 120_000;
// 청크 간 딜레이 (Rate Limit 방지)
const CHUNK_DELAY_MS = 1500;

/**
 * 자기 자신을 다시 호출 (Continuation)
 */
async function invokeSelf(
  linkId: number,
  startChunkIndex: number
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const functionUrl = `${supabaseUrl}/functions/v1/process_link_v2`;

  console.log(
    `[process_link_v2] Invoking self for link ${linkId}, starting from chunk ${startChunkIndex}`
  );

  try {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        link_id: linkId,
        start_chunk_index: startChunkIndex,
      }),
    });

    if (!response.ok) {
      console.error(
        `[process_link_v2] Self-invocation failed:`,
        await response.text()
      );
    }
  } catch (error) {
    console.error(`[process_link_v2] Self-invocation error:`, error);
  }
}

/**
 * 지연 함수
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let linkId: number | null = null;
  const startTime = Date.now();

  try {
    const body = await req.json();
    linkId = body.link_id;
    const startChunkIndex: number = body.start_chunk_index ?? 0;
    const isResume = startChunkIndex > 0;

    if (!linkId) {
      return new Response(
        JSON.stringify({ ok: false, error: "link_id is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(
      `[process_link_v2] Starting processing for link_id: ${linkId}, startChunkIndex: ${startChunkIndex}`
    );

    // ========================================
    // STEP 0: Claim 또는 Resume
    // ========================================
    if (!isResume) {
      // 첫 호출: Claim (중복 실행 방지)
      const { data: claimed, error: claimError } = await supabase
        .from("links")
        .update({
          status: "PROCESSING",
          started_at: new Date().toISOString(),
          error_code: null,
          error_message: null,
          error_detail: null,
          current_chunk_index: 0,
          total_chunks: 0,
          chunk_results: [],
        })
        .eq("id", linkId)
        .in("status", ["PENDING", "FAILED"])
        .select()
        .single();

      if (claimError || !claimed) {
        console.log(
          `[process_link_v2] Link ${linkId} already processing or not found`
        );
        return new Response(
          JSON.stringify({
            ok: false,
            reason: "already_processing_or_not_found",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 링크 정보 조회
    const { data: linkData, error: linkError } = await supabase
      .from("links")
      .select("youtube_url, total_chunks, current_chunk_index, chunk_results")
      .eq("id", linkId)
      .single();

    if (linkError || !linkData) {
      await failLink(supabase, linkId, "LINK_NOT_FOUND", "링크를 찾을 수 없어요");
      return new Response(
        JSON.stringify({ ok: false, error: "LINK_NOT_FOUND" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const youtubeUrl = linkData.youtube_url;
    console.log(`[process_link_v2] YouTube URL: ${youtubeUrl}`);

    // ========================================
    // STEP 1: Video ID 파싱 (첫 호출 시만)
    // ========================================
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      await failLink(
        supabase,
        linkId,
        "INVALID_YOUTUBE_URL",
        "유효한 유튜브 링크가 아니에요"
      );
      return new Response(
        JSON.stringify({ ok: false, error: "INVALID_YOUTUBE_URL" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // STEP 2: YouTube 메타데이터 조회 (첫 호출 시만)
    // ========================================
    let chunks: ChunkInfo[];
    let chunkResults: ChunkResult[];
    let planTitle = "";

    if (!isResume) {
      await updateProgress(
        supabase,
        linkId,
        10,
        "fetch_meta",
        "영상 정보를 확인 중이에요"
      );

      console.log(`[process_link_v2] Fetching YouTube metadata for: ${videoId}`);
      const ytMeta = await fetchYouTubeMeta(videoId);

      if (!ytMeta) {
        await failLink(
          supabase,
          linkId,
          "YT_FETCH_FAILED",
          "영상을 불러올 수 없어요"
        );
        return new Response(
          JSON.stringify({ ok: false, error: "YT_FETCH_FAILED" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 메타데이터 저장
      await supabase
        .from("links")
        .update({
          youtube_video_id: videoId,
          youtube_channel_name: ytMeta.channelTitle,
          youtube_channel_id: ytMeta.channelId,
        })
        .eq("id", linkId);

      // 청크 생성
      chunks = createChunks(ytMeta.durationSeconds);
      chunkResults = [];
      planTitle = ytMeta.title;

      // 청크 정보 저장
      await supabase
        .from("links")
        .update({
          total_chunks: chunks.length,
          current_chunk_index: 0,
        })
        .eq("id", linkId);

      console.log(
        `[process_link_v2] Video duration: ${ytMeta.durationSeconds}s, ${chunks.length} chunks`
      );

      await updateProgress(
        supabase,
        linkId,
        20,
        "extract_places",
        `장소 추출 중... (0/${chunks.length} 구간)`
      );
    } else {
      // Resume: 기존 진행 상태 로드
      const progress = await loadChunkProgress(supabase, linkId);
      if (!progress || progress.totalChunks === 0) {
        await failLink(
          supabase,
          linkId,
          "RESUME_FAILED",
          "진행 상태를 불러올 수 없어요"
        );
        return new Response(
          JSON.stringify({ ok: false, error: "RESUME_FAILED" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // YouTube 메타 다시 조회해서 청크 재생성
      const ytMeta = await fetchYouTubeMeta(videoId);
      if (!ytMeta) {
        await failLink(
          supabase,
          linkId,
          "YT_FETCH_FAILED",
          "영상을 불러올 수 없어요"
        );
        return new Response(
          JSON.stringify({ ok: false, error: "YT_FETCH_FAILED" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      chunks = createChunks(ytMeta.durationSeconds);
      chunkResults = progress.chunkResults;
      planTitle = ytMeta.title;

      console.log(
        `[process_link_v2] Resuming from chunk ${startChunkIndex}, loaded ${chunkResults.length} previous results`
      );
    }

    // ========================================
    // STEP 3: 청크별 분석 (시간 체크하며)
    // ========================================
    for (let i = startChunkIndex; i < chunks.length; i++) {
      const elapsed = Date.now() - startTime;

      // 시간 초과 체크: 다음 청크 처리할 시간이 부족하면 자기 호출
      if (elapsed > MAX_EXECUTION_TIME_MS) {
        console.log(
          `[process_link_v2] Time limit approaching (${elapsed}ms), saving progress and invoking self`
        );

        // 현재까지 결과 저장
        await saveChunkProgress(supabase, linkId, i, chunks.length, chunkResults);

        // 자기 자신 재호출 (다음 청크부터)
        await invokeSelf(linkId, i);

        return new Response(
          JSON.stringify({
            ok: true,
            reason: "continuation",
            processed_chunks: i,
            total_chunks: chunks.length,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const chunk = chunks[i];
      console.log(
        `[process_link_v2] Processing chunk ${i + 1}/${chunks.length} (${chunk.startSec}s-${chunk.endSec}s)`
      );

      const result = await analyzeChunk(youtubeUrl, chunk);

      if (result && result.places && result.places.length > 0) {
        chunkResults.push({
          chunkIndex: i,
          places: result.places,
        });

        if (!planTitle && result.plan_title) {
          planTitle = result.plan_title;
        }

        console.log(
          `[process_link_v2] Chunk ${i + 1}: found ${result.places.length} places`
        );
      } else {
        console.log(`[process_link_v2] Chunk ${i + 1}: no places found`);
      }

      // 진행 상태 업데이트
      await saveChunkProgress(supabase, linkId, i + 1, chunks.length, chunkResults);

      // 청크 간 딜레이 (Rate Limit 방지)
      if (i < chunks.length - 1) {
        await delay(CHUNK_DELAY_MS);
      }
    }

    // ========================================
    // STEP 4: 모든 청크 완료 - 결과 병합
    // ========================================
    console.log(
      `[process_link_v2] All chunks completed, merging ${chunkResults.length} chunk results`
    );

    await updateProgress(
      supabase,
      linkId,
      85,
      "persist",
      "여행 계획을 정리 중이에요"
    );

    const mergedPlaces = mergeChunkResults(chunkResults);
    const validatedPlaces = validatePlaces(mergedPlaces);

    if (validatedPlaces.length === 0) {
      await failLink(
        supabase,
        linkId,
        "NO_PLACES_FOUND",
        "영상에서 장소를 찾을 수 없어요"
      );
      return new Response(
        JSON.stringify({ ok: false, error: "NO_PLACES_FOUND" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process_link_v2] Validated ${validatedPlaces.length} places`);

    // ========================================
    // STEP 5: DB 저장
    // ========================================
    const saveSuccess = await saveItemsFromChunks(
      supabase,
      linkId,
      validatedPlaces
    );

    if (!saveSuccess) {
      await failLink(
        supabase,
        linkId,
        "DB_INSERT_FAILED",
        "장소 저장에 실패했어요"
      );
      return new Response(
        JSON.stringify({ ok: false, error: "DB_INSERT_FAILED" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // STEP 6: 완료
    // ========================================
    await completeLink(supabase, linkId, planTitle);

    const totalElapsed = Date.now() - startTime;
    console.log(
      `[process_link_v2] ✅ Successfully processed link_id: ${linkId} in ${totalElapsed}ms, ${validatedPlaces.length} places`
    );

    return new Response(
      JSON.stringify({
        ok: true,
        places_count: validatedPlaces.length,
        total_chunks: chunks.length,
        elapsed_ms: totalElapsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[process_link_v2] Unexpected error:`, error);

    if (linkId) {
      await failLink(
        supabase,
        linkId,
        "UNKNOWN_ERROR",
        "알 수 없는 오류가 발생했어요",
        { message: String(error) }
      );
    }

    return new Response(JSON.stringify({ ok: false, error: "UNKNOWN_ERROR" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

