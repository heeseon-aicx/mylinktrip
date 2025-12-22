import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractVideoId, fetchYouTubeMeta } from "./youtube.ts";
import { analyzeVideoWithGemini } from "./gemini.ts";
import { updateProgress, failLink, completeLink } from "./progress.ts";
import { validatePlaces, GeminiPlace } from "./validate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  try {
    const body = await req.json();
    linkId = body.link_id;

    if (!linkId) {
      return new Response(
        JSON.stringify({ ok: false, error: "link_id is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[process_link] Starting processing for link_id: ${linkId}`);

    // ========================================
    // STEP 0: Claim (중복 실행 방지)
    // ========================================
    const { data: claimed, error: claimError } = await supabase
      .from("links")
      .update({ 
        status: "PROCESSING", 
        started_at: new Date().toISOString(),
        error_code: null,
        error_message: null,
        error_detail: null,
      })
      .eq("id", linkId)
      .in("status", ["PENDING", "FAILED"])
      .select()
      .single();

    if (claimError || !claimed) {
      console.log(`[process_link] Link ${linkId} already processing or not found`);
      return new Response(
        JSON.stringify({ ok: false, reason: "already_processing_or_not_found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const youtubeUrl = claimed.youtube_url;
    console.log(`[process_link] YouTube URL: ${youtubeUrl}`);

    // ========================================
    // STEP 1: Video ID 파싱
    // ========================================
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      await failLink(supabase, linkId, "INVALID_YOUTUBE_URL", "유효한 유튜브 링크가 아니에요");
      return new Response(
        JSON.stringify({ ok: false, error: "INVALID_YOUTUBE_URL" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await updateProgress(supabase, linkId, 10, "fetch_meta", "영상 정보를 확인 중이에요");

    // ========================================
    // STEP 2: YouTube 메타데이터 조회
    // ========================================
    console.log(`[process_link] Fetching YouTube metadata for: ${videoId}`);
    const ytMeta = await fetchYouTubeMeta(videoId);
    
    if (!ytMeta) {
      await failLink(supabase, linkId, "YT_FETCH_FAILED", "영상을 불러올 수 없어요");
      return new Response(
        JSON.stringify({ ok: false, error: "YT_FETCH_FAILED" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 메타데이터 저장
    await supabase.from("links").update({
      youtube_video_id: videoId,
      youtube_channel_name: ytMeta.channelTitle,
      youtube_channel_id: ytMeta.channelId,
    }).eq("id", linkId);

    await updateProgress(supabase, linkId, 20, "fetch_meta", "영상 메타데이터를 분석 중이에요");

    // ========================================
    // STEP 3: Gemini 영상 분석 (5분 단위 분할)
    // ========================================
    const totalChunks = Math.ceil(ytMeta.durationSeconds / 300);
    console.log(`[process_link] Analyzing video with Gemini (${ytMeta.durationSeconds}s, ${totalChunks} chunks)...`);
    await updateProgress(supabase, linkId, 30, "extract_places", `영상 속 장소를 추출 중이에요 (${totalChunks}개 구간)`);

    const geminiResult = await analyzeVideoWithGemini(youtubeUrl, ytMeta.durationSeconds);
    
    if (!geminiResult) {
      await failLink(supabase, linkId, "GEMINI_PARSE_FAILED", "영상 분석에 실패했어요");
      return new Response(
        JSON.stringify({ ok: false, error: "GEMINI_PARSE_FAILED" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process_link] Gemini result: plan_title=${geminiResult.plan_title}, places=${geminiResult.places?.length || 0}`);
    await updateProgress(supabase, linkId, 70, "extract_places", "장소 정보를 검증 중이에요");

    // ========================================
    // STEP 4: 검증
    // ========================================
    const validatedPlaces = validatePlaces(geminiResult.places || []);
    
    if (validatedPlaces.length === 0) {
      await failLink(supabase, linkId, "NO_PLACES_FOUND", "영상에서 장소를 찾을 수 없어요");
      return new Response(
        JSON.stringify({ ok: false, error: "NO_PLACES_FOUND" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process_link] Validated ${validatedPlaces.length} places`);
    await updateProgress(supabase, linkId, 85, "persist", "여행 계획을 정리 중이에요");

    // ========================================
    // STEP 5: DB 저장
    // ========================================
    // 기존 items soft delete
    await supabase
      .from("link_place_items")
      .update({ is_deleted: true })
      .eq("link_id", linkId);

    // 새 items 저장
    const items = validatedPlaces.map((place: GeminiPlace, idx: number) => ({
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
      console.error(`[process_link] Insert error:`, insertError);
      await failLink(supabase, linkId, "DB_INSERT_FAILED", "장소 저장에 실패했어요", insertError);
      return new Response(
        JSON.stringify({ ok: false, error: "DB_INSERT_FAILED" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // STEP 6: Finalize
    // ========================================
    await completeLink(supabase, linkId, geminiResult.plan_title || ytMeta.title);

    console.log(`[process_link] ✅ Successfully processed link_id: ${linkId}`);
    return new Response(
      JSON.stringify({ ok: true, places_count: validatedPlaces.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[process_link] Unexpected error:`, error);
    
    // link_id가 있으면 실패 처리
    if (linkId) {
      await failLink(supabase, linkId, "UNKNOWN_ERROR", "알 수 없는 오류가 발생했어요", { message: String(error) });
    }

    return new Response(
      JSON.stringify({ ok: false, error: "UNKNOWN_ERROR" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

