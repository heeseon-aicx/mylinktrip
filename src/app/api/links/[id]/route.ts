import { NextRequest, NextResponse } from "next/server";
import { getLink } from "@/lib/services/links.server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/links/:id
 * 링크 상세 조회 (장소 아이템 포함)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const linkId = parseInt(id, 10);

    if (isNaN(linkId)) {
      return NextResponse.json(
        { error: { code: "INVALID_ID", message: "유효하지 않은 ID입니다" } },
        { status: 400 }
      );
    }

    const link = await getLink(linkId);

    if (!link) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "링크를 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    return NextResponse.json(link);
  } catch (error) {
    console.error("GET /api/links/:id error:", error);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "링크 조회에 실패했습니다" } },
      { status: 500 }
    );
  }
}



