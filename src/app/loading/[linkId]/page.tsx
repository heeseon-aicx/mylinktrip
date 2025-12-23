"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLinkDetail, useCreateLink } from "@/features/links/hooks";
import type { LinkStage } from "@/data/types";

export default function LoadingPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = Number(params.linkId);

  const { data: link, isLoading, isError } = useLinkDetail(linkId, {
    polling: true,
  });

  const createLink = useCreateLink();

  // READY 시 자동 이동
  useEffect(() => {
    if (link?.status === "READY") {
      router.push(`/links/${linkId}`);
    }
  }, [link?.status, linkId, router]);

  // 재시도 핸들러
  const handleRetry = () => {
    if (link?.youtube_url) {
      createLink.mutate(link.youtube_url);
    } else {
      router.push("/");
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2B96ED] rounded-full animate-spin" />
      </div>
    );
  }

  // 에러
  if (isError || !link) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          링크를 찾을 수 없어요
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

  // 실패 상태
  if (link.status === "FAILED") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">분석 실패</h1>

        <p className="text-gray-500 text-center mb-6 max-w-xs">
          {link.error_message || "영상을 분석하는 중 오류가 발생했습니다"}
        </p>

        {link.error_code && (
          <div className="mb-6 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-500">
            에러 코드: {link.error_code}
          </div>
        )}

        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={handleRetry}
            disabled={createLink.isPending}
            className="w-full py-3 bg-[#2B96ED] text-white font-semibold rounded-xl hover:bg-[#1A7FD1] transition-colors disabled:opacity-50"
          >
            {createLink.isPending ? "재시도 중..." : "다시 시도하기"}
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            다른 영상으로 시도하기
          </button>
        </div>
      </div>
    );
  }

  // 처리 중 상태
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      {/* 로딩 아이콘 */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-[#EBF5FF] rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[#2B96ED] animate-pulse"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
          </svg>
        </div>
      </div>

      {/* 상태 메시지 */}
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        영상을 분석하고 있어요
      </h2>
      <p className="text-gray-500 text-sm mb-8">잠시만 기다려주세요</p>

      {/* 프로그레스 바 */}
      <div className="w-full max-w-xs mb-8">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{link.status_message || "분석 중..."}</span>
          <span>{link.progress_pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2B96ED] rounded-full transition-all duration-500"
            style={{ width: `${link.progress_pct}%` }}
          />
        </div>
      </div>

      {/* 단계 체크리스트 */}
      <div className="w-full max-w-xs bg-gray-50 rounded-xl p-4">
        <div className="space-y-3">
          <StageItem
            stage="fetch_meta"
            currentStage={link.stage}
            progress={link.progress_pct}
            label="영상 정보 확인"
            threshold={10}
          />
          <StageItem
            stage="transcribe"
            currentStage={link.stage}
            progress={link.progress_pct}
            label="자막 분석"
            threshold={30}
          />
          <StageItem
            stage="extract_places"
            currentStage={link.stage}
            progress={link.progress_pct}
            label="장소 추출"
            threshold={70}
          />
          <StageItem
            stage="summarize"
            currentStage={link.stage}
            progress={link.progress_pct}
            label="여행 계획 생성"
            threshold={90}
          />
        </div>
      </div>

      {/* 취소 버튼 */}
      <button
        onClick={() => router.push("/")}
        className="mt-8 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        취소하고 돌아가기
      </button>
    </div>
  );
}

// ============================================
// Stage Item Component
// ============================================

interface StageItemProps {
  stage: LinkStage;
  currentStage: LinkStage | null;
  progress: number;
  label: string;
  threshold: number;
}

function StageItem({
  stage,
  currentStage,
  progress,
  label,
  threshold,
}: StageItemProps) {
  const isActive = currentStage === stage;
  const isComplete = progress >= threshold + 20;
  const isPending = progress < threshold;

  return (
    <div className="flex items-center gap-3">
      {/* 상태 아이콘 */}
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-all flex-shrink-0 ${
          isComplete
            ? "bg-green-500"
            : isActive
              ? "bg-[#2B96ED]"
              : "bg-gray-200"
        }`}
      >
        {isComplete ? (
          <svg
            className="h-3.5 w-3.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : isActive ? (
          <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
        ) : (
          <div className="h-2 w-2 bg-gray-400 rounded-full" />
        )}
      </div>

      {/* 라벨 */}
      <span
        className={`flex-1 text-sm transition-colors ${
          isComplete
            ? "text-green-600"
            : isActive
              ? "text-gray-900 font-medium"
              : "text-gray-400"
        }`}
      >
        {label}
      </span>

      {/* 상태 텍스트 */}
      {isActive && (
        <span className="text-xs text-[#2B96ED]">진행 중</span>
      )}
    </div>
  );
}
