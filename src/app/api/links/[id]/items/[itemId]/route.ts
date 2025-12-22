import { NextRequest, NextResponse } from "next/server";
import {
  getLinkItem,
  updateLinkItem,
  deleteLinkItem,
} from "@/lib/services/links.server";

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

/**
 * GET /api/links/:id/items/:itemId
 * 장소 아이템 단일 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { itemId } = await params;
    const parsedItemId = parseInt(itemId, 10);

    if (isNaN(parsedItemId)) {
      return NextResponse.json(
        { error: { code: "INVALID_ID", message: "유효하지 않은 ID입니다" } },
        { status: 400 }
      );
    }

    const item = await getLinkItem(parsedItemId);

    if (!item) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "아이템을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("GET /api/links/:id/items/:itemId error:", error);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "아이템 조회에 실패했습니다" } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/links/:id/items/:itemId
 * 장소 아이템 수정 (메모, 순서, 삭제 상태)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { itemId } = await params;
    const parsedItemId = parseInt(itemId, 10);

    if (isNaN(parsedItemId)) {
      return NextResponse.json(
        { error: { code: "INVALID_ID", message: "유효하지 않은 ID입니다" } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { user_memo, order_index, is_deleted } = body;

    // 최소 하나의 필드가 있어야 함
    if (
      user_memo === undefined &&
      order_index === undefined &&
      is_deleted === undefined
    ) {
      return NextResponse.json(
        {
          error: {
            code: "NO_UPDATE_FIELDS",
            message: "수정할 필드가 없습니다",
          },
        },
        { status: 400 }
      );
    }

    const item = await updateLinkItem(parsedItemId, {
      user_memo,
      order_index,
      is_deleted,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("PATCH /api/links/:id/items/:itemId error:", error);
    return NextResponse.json(
      { error: { code: "UPDATE_FAILED", message: "아이템 수정에 실패했습니다" } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/links/:id/items/:itemId
 * 장소 아이템 삭제 (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { itemId } = await params;
    const parsedItemId = parseInt(itemId, 10);

    if (isNaN(parsedItemId)) {
      return NextResponse.json(
        { error: { code: "INVALID_ID", message: "유효하지 않은 ID입니다" } },
        { status: 400 }
      );
    }

    await deleteLinkItem(parsedItemId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/links/:id/items/:itemId error:", error);
    return NextResponse.json(
      { error: { code: "DELETE_FAILED", message: "아이템 삭제에 실패했습니다" } },
      { status: 500 }
    );
  }
}



