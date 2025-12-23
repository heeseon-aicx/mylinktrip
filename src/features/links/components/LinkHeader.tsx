"use client";

import { useRouter } from "next/navigation";
import type { Link } from "@/data/types";

interface LinkHeaderProps {
  link: Link;
}

export function LinkHeader({ link }: LinkHeaderProps) {
  const router = useRouter();
  const title = link.title_user || link.title_ai || "여행 계획";

  const handleShare = async () => {
    const shareData = {
      title: title,
      text: `${title} - MyLinkTrip으로 만든 여행 계획`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("링크가 복사되었습니다!");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("공유 실패:", err);
      }
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
      {/* 상단 네비게이션 */}
      <div className="flex items-center h-[52px] px-4">
        {/* 뒤로가기 */}
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 -ml-2 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* 제목 */}
        <h1 className="flex-1 font-semibold text-gray-900 truncate px-2">
          {title}
        </h1>

        {/* 공유 버튼 */}
        <button
          onClick={handleShare}
          className="w-10 h-10 -mr-2 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
      </div>

      {/* 서브 정보 */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {link.youtube_channel_name && (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
              <span>{link.youtube_channel_name}</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
