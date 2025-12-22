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

/**
 * Gemini 결과 검증 및 정규화
 */
export function validatePlaces(places: unknown[]): GeminiPlace[] {
  if (!Array.isArray(places)) {
    console.error("[validate] places is not an array");
    return [];
  }

  const validated: GeminiPlace[] = [];

  for (const place of places) {
    if (!place || typeof place !== "object") continue;

    const p = place as Record<string, unknown>;

    // place_name 필수
    if (!p.place_name || typeof p.place_name !== "string" || p.place_name.trim() === "") {
      console.warn("[validate] Skipping place without name:", place);
      continue;
    }

    // category 검증
    let category: "TNA" | "LODGING" | null = null;
    if (p.category === "TNA" || p.category === "LODGING") {
      category = p.category;
    } else if (typeof p.category === "string") {
      // 유연한 매핑
      const cat = p.category.toUpperCase();
      if (cat.includes("LODGING") || cat.includes("HOTEL") || cat.includes("숙소")) {
        category = "LODGING";
      } else {
        category = "TNA";
      }
    }

    // timeline 검증
    const timelineStart = typeof p.timeline_start_sec === "number" && p.timeline_start_sec >= 0 
      ? Math.floor(p.timeline_start_sec) 
      : null;
    const timelineEnd = typeof p.timeline_end_sec === "number" && p.timeline_end_sec >= 0 
      ? Math.floor(p.timeline_end_sec) 
      : null;

    validated.push({
      place_name: p.place_name.trim(),
      category,
      timeline_start_sec: timelineStart,
      timeline_end_sec: timelineEnd,
      country: typeof p.country === "string" ? p.country.trim() : null,
      city: typeof p.city === "string" ? p.city.trim() : null,
      youtuber_comment: typeof p.youtuber_comment === "string" ? p.youtuber_comment.trim() : null,
      confidence: typeof p.confidence === "number" ? p.confidence : undefined,
    });
  }

  // 중복 제거 (place_name 기준)
  const unique = validated.reduce((acc, curr) => {
    const existing = acc.find(p => p.place_name.toLowerCase() === curr.place_name.toLowerCase());
    if (!existing) {
      acc.push(curr);
    }
    return acc;
  }, [] as GeminiPlace[]);

  console.log(`[validate] Validated ${unique.length} places from ${places.length} raw places`);
  return unique;
}

