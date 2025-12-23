import "./deno.d.ts";

/**
 * YouTube URL에서 Video ID 추출
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

export interface YouTubeMeta {
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  thumbnailUrl: string;
  durationSeconds: number;
}

/**
 * ISO 8601 Duration을 초로 변환 (예: PT1H30M45S -> 5445)
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * YouTube Data API v3로 메타데이터 조회 (duration 포함)
 */
export async function fetchYouTubeMeta(videoId: string): Promise<YouTubeMeta | null> {
  const apiKey = Deno.env.get("YOUTUBE_DATA_API_V3_KEY");
  
  if (!apiKey) {
    console.error("[youtube] YOUTUBE_DATA_API_V3_KEY not found");
    return null;
  }

  // snippet + contentDetails (duration 포함)
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      console.error("[youtube] API error:", data);
      return null;
    }

    if (!data.items?.[0]) {
      console.error("[youtube] Video not found");
      return null;
    }

    const snippet = data.items[0].snippet;
    const contentDetails = data.items[0].contentDetails;
    
    const durationSeconds = parseDuration(contentDetails.duration);
    console.log(`[youtube] Video duration: ${durationSeconds}s (${contentDetails.duration})`);
    
    return {
      title: snippet.title,
      description: snippet.description,
      channelTitle: snippet.channelTitle,
      channelId: snippet.channelId,
      thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
      durationSeconds,
    };
  } catch (error) {
    console.error("[youtube] Fetch error:", error);
    return null;
  }
}
