"use client";

import { useState } from "react";
import Image from "next/image";
import type { LinkItem } from "@/data/types";
import {
  formatTimestamp,
  getGoogleMapsUrl,
  getMrtSearchUrl,
  getCategoryLabel,
} from "@/lib/utils";

interface PlaceCardProps {
  item: LinkItem;
  videoId: string | null;
  isLast?: boolean;
  onUpdateMemo?: (memo: string | null) => void;
  onDelete?: () => void;
}

// 카테고리별 아이콘/색상
const CATEGORY_CONFIG = {
  TNA: { icon: "🎯", color: "bg-blue-50 text-blue-600" },
  LODGING: { icon: "🏨", color: "bg-purple-50 text-purple-600" },
};

export function PlaceCard({
  item,
  videoId,
  isLast = false,
  onUpdateMemo,
  onDelete,
}: PlaceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [memo, setMemo] = useState(item.user_memo || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const config = item.category
    ? CATEGORY_CONFIG[item.category]
    : CATEGORY_CONFIG.TNA;
  const categoryLabel = getCategoryLabel(item.category);
  const timeDisplay = formatTimestamp(item.timeline_start_sec);

  const handleSaveMemo = () => {
    const trimmedMemo = memo.trim();
    onUpdateMemo?.(trimmedMemo || null);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setMemo(item.user_memo || "");
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete?.();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="flex gap-3 relative">
      {/* 왼쪽: 타임라인 아이콘 */}
      <div className="flex flex-col items-center w-9 flex-shrink-0 pt-3">
        {/* 아이콘 */}
        <div
          className={`w-9 h-9 rounded-lg ${config.color} flex items-center justify-center text-lg flex-shrink-0`}
        >
          {config.icon}
        </div>

        {/* 세로 연결선 */}
        {!isLast && <div className="w-px flex-1 bg-gray-200 mt-2 min-h-[20px]" />}
      </div>

      {/* 오른쪽: 내용 */}
      <div className="flex-1 min-w-0 pb-4">
        {/* 장소 카드 */}
        <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* 장소명 */}
              <h3 className="font-medium text-gray-900 leading-tight">
                {item.place_name}
              </h3>

              {/* 카테고리 + 위치 */}
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                {categoryLabel && <span>{categoryLabel}</span>}
                {(item.city || item.country) && (
                  <>
                    {categoryLabel && <span>·</span>}
                    <span>
                      {[item.city, item.country].filter(Boolean).join(", ")}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 삭제 버튼 */}
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* 유튜브 타임스탬프 버튼 */}
          {timeDisplay && videoId && (
            <a
              href={`https://www.youtube.com/watch?v=${videoId}&t=${item.timeline_start_sec}s`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
              <span className="font-semibold">{timeDisplay}</span>
            </a>
          )}

          {/* 유튜버 코멘트 */}
          {item.youtuber_comment && (
            <p className="text-xs text-gray-500 mt-2 italic">
              💬 "{item.youtuber_comment}"
            </p>
          )}

          {/* 사용자 메모 - 보기/편집 모드 */}
          {isEditing ? (
            <div className="mt-3">
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모를 입력하세요..."
                className="w-full resize-none rounded-lg bg-white p-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2B96ED] focus:border-transparent"
                rows={2}
                autoFocus
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveMemo}
                  className="px-3 py-1.5 text-xs font-medium bg-[#2B96ED] text-white rounded-lg hover:bg-[#1A7FD1] transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          ) : item.user_memo ? (
            <div
              onClick={() => onUpdateMemo && setIsEditing(true)}
              className={`mt-3 p-2 rounded-lg bg-blue-50 border border-blue-100 ${
                onUpdateMemo ? "cursor-pointer hover:border-blue-200" : ""
              }`}
            >
              <p className="text-xs text-[#2B96ED]">📝 {item.user_memo}</p>
            </div>
          ) : (
            onUpdateMemo && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-[#2B96ED] transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>메모 추가</span>
              </button>
            )
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 mt-3">
            {/* Google Maps */}
            <a
              href={getGoogleMapsUrl(item.place_name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Image
                src="/google-maps.png"
                alt="Google Maps"
                width={16}
                height={16}
                className="flex-shrink-0"
              />
              <span>구글맵 보기</span>
            </a>

            {/* 마이리얼트립 검색 */}
            <a
              href={getMrtSearchUrl(item.place_name, item.city, item.category)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Image
                src="/myrealtrip.jpg"
                alt="MyRealTrip"
                width={16}
                height={16}
                className="flex-shrink-0 rounded-sm"
              />
              <span>마이리얼트립에서 보기</span>
            </a>
          </div>
        </div>

        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 bg-white rounded-2xl p-6 max-w-sm w-full animate-scale-in">
              <p className="text-center text-gray-900 mb-6">
                <span className="font-semibold">{item.place_name}</span>을(를)
                <br />
                삭제하시겠어요?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
