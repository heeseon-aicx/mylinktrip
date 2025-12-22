import { NextRequest, NextResponse } from "next/server";
import {
  createLink,
  isValidYoutubeUrl,
} from "@/lib/services/links.server";

/**
 * POST /api/links
 * 링크 생성 (유튜브 URL 입력)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youtube_url } = body;

    // Validation
    if (!youtube_url) {
      return NextResponse.json(
        { error: { code: "MISSING_URL", message: "youtube_url은 필수입니다" } },
        { status: 400 }
      );
    }

    if (!isValidYoutubeUrl(youtube_url)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_URL",
            message: "유효하지 않은 유튜브 URL입니다",
          },
        },
        { status: 400 }
      );
    }

    // Create link
    const link = await createLink({ youtube_url });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("POST /api/links error:", error);
    return NextResponse.json(
      { error: { code: "CREATE_FAILED", message: "링크 생성에 실패했습니다" } },
      { status: 500 }
    );
  }
}

