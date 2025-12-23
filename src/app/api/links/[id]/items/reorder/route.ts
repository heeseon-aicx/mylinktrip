import { NextRequest, NextResponse } from "next/server";
import { reorderLinkItems } from "@/lib/services/links.server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/links/:id/items/reorder
 * 장소 순서 일괄 변경
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const linkId = parseInt(id, 10);

    if (isNaN(linkId)) {
      return NextResponse.json(
        { error: { code: "INVALID_ID", message: "유효하지 않은 ID입니다" } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { item_orders } = body;

    // Validation
    if (!item_orders || !Array.isArray(item_orders)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_BODY",
            message: "item_orders 배열이 필요합니다",
          },
        },
        { status: 400 }
      );
    }

    // 각 아이템 검증
    for (const item of item_orders) {
      if (typeof item.id !== "number" || typeof item.order_index !== "number") {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_ITEM",
              message: "각 아이템은 id와 order_index가 필요합니다",
            },
          },
          { status: 400 }
        );
      }
    }

    const result = await reorderLinkItems(linkId, item_orders);

    return NextResponse.json(result);
  } catch (error) {
    console.error("PATCH /api/links/:id/items/reorder error:", error);
    return NextResponse.json(
      {
        error: { code: "REORDER_FAILED", message: "순서 변경에 실패했습니다" },
      },
      { status: 500 }
    );
  }
}

