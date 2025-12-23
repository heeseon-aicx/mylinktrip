import "./deno.d.ts";

export interface GeminiResult {
  plan_title: string;
  places: GeminiPlace[];
}

export interface GeminiPlace {
  place_name: string;
  category: "TNA" | "LODGING" | null;
  timeline_start_sec: number | null;
  timeline_end_sec: number | null;
  country: string | null;
  city: string | null;
  youtuber_comment: string | null;
  confidence?: number;
}

const EXTRACTION_PROMPT = `당신은 여행 영상 분석 전문가입니다. 이 YouTube 영상을 분석하여 영상에서 언급된 여행 장소를 추출해주세요.

## 핵심 규칙
1. category: "TNA" (관광/맛집/체험) 또는 "LODGING" (숙소)
2. youtuber_comment: 반드시 50자 이내의 짧은 한 줄 요약
3. 중복 장소는 제외
4. 구체적인 장소명 사용 (예: "후시미이나리 신사", "이치란 라멘")

## 출력 예시
{
  "plan_title": "교토 3박4일 여행",
  "places": [
    {
      "place_name": "후시미이나리 신사",
      "category": "TNA",
      "timeline_start_sec": 120,
      "country": "일본",
      "city": "교토",
      "youtuber_comment": "붉은 토리이 터널이 인상적, 24시간 방문 가능"
    }
  ]
}`;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const CHUNK_DURATION_SEC = 300; // 5분 단위

/**
 * Gemini Structured Output용 JSON Schema
 * https://ai.google.dev/gemini-api/docs/structured-output
 */
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    plan_title: {
      type: "string",
      description: "영상 제목 기반 여행 계획명",
      maxLength: 50,
    },
    places: {
      type: "array",
      description: "영상에서 추출한 여행 장소 목록",
      items: {
        type: "object",
        properties: {
          place_name: {
            type: "string",
            description: "장소의 정확한 이름",
            maxLength: 100,
          },
          category: {
            type: "string",
            enum: ["TNA", "LODGING"],
            description: "TNA: 관광/맛집/체험, LODGING: 숙소",
          },
          timeline_start_sec: {
            type: "integer",
            description: "장소 언급 시작 시점 (초)",
          },
          timeline_end_sec: {
            type: "integer",
            description: "장소 언급 종료 시점 (초)",
          },
          country: {
            type: "string",
            description: "국가명",
            maxLength: 20,
          },
          city: {
            type: "string",
            description: "도시명",
            maxLength: 30,
          },
          youtuber_comment: {
            type: "string",
            description: "유튜버의 짧은 한 줄 코멘트 (50자 이내)",
            maxLength: 80,
          },
          confidence: {
            type: "number",
            description: "추출 신뢰도 (0.0 ~ 1.0)",
          },
        },
        required: ["place_name", "category"],
      },
    },
  },
  required: ["plan_title", "places"],
};

/**
 * 지연 함수
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 구간 생성 (5분 단위)
 */
function createChunks(
  durationSeconds: number
): Array<{ start: number; end: number }> {
  const chunks: Array<{ start: number; end: number }> = [];

  for (let start = 0; start < durationSeconds; start += CHUNK_DURATION_SEC) {
    const end = Math.min(start + CHUNK_DURATION_SEC, durationSeconds);
    chunks.push({ start, end });
  }

  return chunks;
}

/**
 * 단일 구간 분석 (클리핑 간격 사용)
 */
async function analyzeChunk(
  youtubeUrl: string,
  startSec: number,
  endSec: number,
  chunkIndex: number,
  totalChunks: number
): Promise<GeminiResult | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `[gemini] Chunk ${
          chunkIndex + 1
        }/${totalChunks} (${startSec}s-${endSec}s), attempt ${attempt}/${MAX_RETRIES}`
      );

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  file_data: {
                    file_uri: youtubeUrl,
                  },
                  video_metadata: {
                    start_offset: `${startSec}s`,
                    end_offset: `${endSec}s`,
                  },
                },
                { text: EXTRACTION_PROMPT },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      });

      const data = await response.json();

      // 503 (과부하) 또는 429 (Rate Limit) 오류면 재시도
      if (
        (response.status === 503 || response.status === 429) &&
        attempt < MAX_RETRIES
      ) {
        const waitTime = RETRY_DELAY_MS * attempt;
        console.warn(
          `[gemini] Server overloaded (${response.status}), retrying in ${waitTime}ms...`
        );
        await delay(waitTime);
        continue;
      }

      if (!response.ok) {
        console.error(
          `[gemini] API error for chunk ${chunkIndex + 1}:`,
          JSON.stringify(data)
        );
        // 청크 하나 실패해도 계속 진행 (null 반환)
        return null;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        // finishReason 체크 (MAX_TOKENS 등으로 잘린 경우)
        const finishReason = data.candidates?.[0]?.finishReason;
        console.warn(
          `[gemini] No text in response for chunk ${chunkIndex + 1}, finishReason: ${finishReason}`
        );
        return null;
      }

      console.log(`[gemini] Chunk ${chunkIndex + 1} response received (${text.length} chars)`);

      // JSON 파싱 (구조화된 출력 사용시 깔끔한 JSON 반환)
      try {
        let jsonText = text.trim();
        
        // 마크다운 코드 블록이 있으면 추출 (fallback)
        const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1].trim();
        }
        
        // 빈 문자열 체크
        if (!jsonText || jsonText === "") {
          console.warn(`[gemini] Empty JSON text for chunk ${chunkIndex + 1}`);
          return null;
        }

        const result = JSON.parse(jsonText) as GeminiResult;
        
        // 결과 유효성 검사
        if (!result.places || !Array.isArray(result.places)) {
          console.warn(`[gemini] Invalid result structure for chunk ${chunkIndex + 1}`);
          return { plan_title: result.plan_title || "", places: [] };
        }
        
        return result;
      } catch (parseError) {
        console.error(
          `[gemini] JSON parse error for chunk ${chunkIndex + 1}:`,
          parseError
        );
        // 디버깅용: 실제 응답 내용 로그 (처음 500자만)
        console.error(`[gemini] Raw response (first 500 chars): ${text.substring(0, 500)}`);
        return null;
      }
    } catch (error) {
      console.error(
        `[gemini] Fetch error for chunk ${
          chunkIndex + 1
        } (attempt ${attempt}/${MAX_RETRIES}):`,
        error
      );

      if (attempt < MAX_RETRIES) {
        const waitTime = RETRY_DELAY_MS * attempt;
        console.warn(`[gemini] Retrying in ${waitTime}ms...`);
        await delay(waitTime);
      }
    }
  }

  console.warn(`[gemini] All attempts failed for chunk ${chunkIndex + 1}`);
  return null;
}

/**
 * Gemini API로 영상 분석 (5분 단위 분할 처리)
 */
export async function analyzeVideoWithGemini(
  youtubeUrl: string,
  durationSeconds?: number
): Promise<GeminiResult | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");

  if (!apiKey) {
    console.error("[gemini] GEMINI_API_KEY not found");
    return null;
  }

  // 5분 이하면 단일 요청
  if (!durationSeconds || durationSeconds <= CHUNK_DURATION_SEC) {
    console.log(
      `[gemini] Short video (${
        durationSeconds || "unknown"
      }s), processing as single chunk`
    );
    return analyzeChunk(youtubeUrl, 0, durationSeconds || 300, 0, 1);
  }

  // 5분 초과면 분할 처리
  const chunks = createChunks(durationSeconds);
  console.log(
    `[gemini] Long video (${durationSeconds}s), splitting into ${chunks.length} chunks of 5min each`
  );

  const allPlaces: GeminiPlace[] = [];
  let planTitle = "";
  let successfulChunks = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const result = await analyzeChunk(
      youtubeUrl,
      chunk.start,
      chunk.end,
      i,
      chunks.length
    );

    if (result) {
      successfulChunks++;

      if (!planTitle && result.plan_title) {
        planTitle = result.plan_title;
      }

      if (result.places && result.places.length > 0) {
        // 타임라인 오프셋 조정 (구간 시작점 더하기)
        const adjustedPlaces = result.places.map((place) => ({
          ...place,
          timeline_start_sec:
            place.timeline_start_sec != null
              ? place.timeline_start_sec + chunk.start
              : null,
          timeline_end_sec:
            place.timeline_end_sec != null
              ? place.timeline_end_sec + chunk.start
              : null,
        }));
        allPlaces.push(...adjustedPlaces);
        console.log(
          `[gemini] Chunk ${i + 1}: found ${result.places.length} places`
        );
      }
    }

    // 구간 사이에 약간의 딜레이 (Rate Limit 방지)
    if (i < chunks.length - 1) {
      await delay(1500);
    }
  }

  console.log(
    `[gemini] Completed: ${successfulChunks}/${chunks.length} chunks successful, ${allPlaces.length} total places`
  );

  if (allPlaces.length === 0) {
    console.error("[gemini] No places found from any chunk");
    return null;
  }

  // 중복 제거 (place_name 기준, 대소문자 무시)
  const uniquePlaces = allPlaces.reduce((acc, curr) => {
    const existing = acc.find(
      (p) => p.place_name.toLowerCase() === curr.place_name.toLowerCase()
    );
    if (!existing) {
      acc.push(curr);
    }
    return acc;
  }, [] as GeminiPlace[]);

  console.log(
    `[gemini] Final: ${uniquePlaces.length} unique places from ${allPlaces.length} raw`
  );

  return {
    plan_title: planTitle,
    places: uniquePlaces,
  };
}
