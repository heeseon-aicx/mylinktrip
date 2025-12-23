"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useLinkDetail,
  useUpdateItem,
  useReorderItems,
} from "@/features/links/hooks";
import { LinkHeader, PlaceListDnD } from "@/features/links/components";

export default function LinkPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = Number(params.linkId);

  const { data: link, isLoading, isError } = useLinkDetail(linkId);
  const updateItem = useUpdateItem(linkId);
  const reorderItems = useReorderItems(linkId);

  // 메모 업데이트 핸들러
  const handleUpdateMemo = (itemId: number) => (memo: string | null) => {
    updateItem.mutate({ itemId, patch: { user_memo: memo } });
  };

  // 삭제 핸들러
  const handleDelete = (itemId: number) => () => {
    updateItem.mutate({ itemId, patch: { is_deleted: true } });
  };

  // 순서 변경 핸들러
  const handleReorder = (
    orderedItems: { id: number; order_index: number }[]
  ) => {
    reorderItems.mutate({ item_orders: orderedItems });
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2B96ED] rounded-full animate-spin" />
      </div>
    );
  }

  // 에러 또는 데이터 없음
  if (isError || !link) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          여행 계획을 찾을 수 없어요
        </h1>
        <p className="text-gray-500 text-center mb-6">
          잘못된 링크이거나 만료된 링크입니다
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-[#2B96ED] text-white font-semibold rounded-xl hover:bg-[#1A7FD1] transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  // 아직 처리 중인 경우
  if (link.status !== "READY") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          아직 분석 중이에요
        </h1>
        <p className="text-gray-500 text-center mb-6">잠시 후 다시 확인해주세요</p>
        <button
          onClick={() => router.push(`/loading/${linkId}`)}
          className="px-6 py-3 bg-[#2B96ED] text-white font-semibold rounded-xl hover:bg-[#1A7FD1] transition-colors"
        >
          로딩 페이지로 이동
        </button>
      </div>
    );
  }

  const items = link.items || [];
  const tnaCount = items.filter((i) => i.category === "TNA").length;
  const lodgingCount = items.filter((i) => i.category === "LODGING").length;

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <LinkHeader link={link} />

      {/* 메인 콘텐츠 */}
      <main className="px-4 py-4">
        {/* 통계 바 */}
        <div className="flex items-center gap-4 p-3 mb-4 bg-gray-50 rounded-xl text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <span className="text-gray-600">
              체험 <span className="font-semibold text-gray-900">{tnaCount}</span>곳
            </span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-lg">🏨</span>
            <span className="text-gray-600">
              숙소 <span className="font-semibold text-gray-900">{lodgingCount}</span>곳
            </span>
          </div>
        </div>

        {/* 드래그 안내 */}
        {items.length > 1 && (
          <p className="text-center text-xs text-gray-400 mb-4">
            💡 카드를 길게 누르면 순서를 변경할 수 있어요
          </p>
        )}

        {/* 장소 카드 리스트 */}
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 text-5xl">📍</div>
            <p className="text-gray-500">아직 추출된 장소가 없습니다</p>
          </div>
        ) : (
          <PlaceListDnD
            items={items}
            videoId={link.youtube_video_id}
            onUpdateMemo={handleUpdateMemo}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        )}

        {/* 하단 여백 */}
        <div className="h-8" />
      </main>
    </div>
  );
}
