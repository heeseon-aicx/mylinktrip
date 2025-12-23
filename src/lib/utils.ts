import type { PlaceCategory } from "@/data/types";

/**
 * 초(sec)를 mm:ss 형식으로 변환
 */
export function formatTimestamp(seconds: number | null): string {
  if (seconds === null) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * 유튜브 비디오 ID와 시간으로 타임스탬프 URL 생성
 */
export function getYoutubeTimestampUrl(
  videoId: string,
  seconds: number
): string {
  return `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`;
}

/**
 * Google Maps 검색 URL 생성
 */
export function getGoogleMapsUrl(placeName: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`;
}

/**
 * 마이리얼트립 검색 URL 생성
 * TODO: 실제 마이리얼트립 URL 구조 확인 후 수정 필요
 */
export function getMrtSearchUrl(
  placeName: string,
  city: string | null,
  category: PlaceCategory | null
): string {
  const type = category === "LODGING" ? "accommodations" : "tna";
  const query = city
    ? encodeURIComponent(`${city} ${placeName}`)
    : encodeURIComponent(placeName);
  return `https://www.myrealtrip.com/${type}?search=${query}`;
}

/**
 * 유튜브 URL에서 video ID 추출
 */
export function extractVideoId(url: string): string | null {
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
 * 카테고리 라벨 변환
 */
export function getCategoryLabel(category: PlaceCategory | null): string {
  if (!category) return "";
  return category === "LODGING" ? "숙소" : "체험";
}

