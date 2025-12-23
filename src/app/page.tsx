"use client";

import { useState } from "react";
import Image from "next/image";
import { useCreateLink } from "@/features/links/hooks";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createLink = useCreateLink();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("유튜브 URL을 입력해주세요");
      return;
    }

    if (!isValidYoutubeUrl(url)) {
      setError("올바른 유튜브 URL이 아닙니다");
      return;
    }

    createLink.mutate(url);
  };

  const fillExample = () => {
    setUrl("https://www.youtube.com/watch?v=tokyo123");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2B96ED] rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">MyLinkTrip</span>
        </div>
        <Image
          src="/myrealtrip.jpg"
          alt="MyRealTrip"
          width={24}
          height={24}
          className="rounded"
        />
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* 타이틀 */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            유튜브 영상 → 여행 계획
          </h1>
          <p className="text-gray-500">
            링크만 붙여넣으면 끝!
          </p>
        </div>

        {/* URL 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="유튜브 링크 붙여넣기"
              className={`w-full h-14 px-4 pr-12 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2B96ED] focus:border-transparent focus:bg-white transition-all ${
                error ? "border-red-300" : "border-transparent"
              }`}
              disabled={createLink.isPending}
            />
            {url && (
              <button
                type="button"
                onClick={() => {
                  setUrl("");
                  setError(null);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* 에러 메시지 */}
          {(error || createLink.isError) && (
            <p className="text-sm text-red-500 text-center">
              {error || "오류가 발생했습니다. 다시 시도해주세요."}
            </p>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={createLink.isPending || !url.trim()}
            className="w-full h-14 bg-[#2B96ED] text-white font-semibold rounded-xl hover:bg-[#1A7FD1] transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {createLink.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                분석 중...
              </span>
            ) : (
              "변환하기"
            )}
          </button>
        </form>

        {/* 예시 링크 */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={fillExample}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2B96ED] transition-colors"
          >
            <span>🎬</span>
            <span>예시 영상으로 체험해보기</span>
          </button>
        </div>
      </main>

      {/* 하단 설명 */}
      <section className="px-6 pb-8">
        <div className="flex justify-center gap-8 text-center">
          <div>
            <div className="text-2xl mb-1">📍</div>
            <p className="text-xs text-gray-500">장소 추출</p>
          </div>
          <div>
            <div className="text-2xl mb-1">📝</div>
            <p className="text-xs text-gray-500">메모 추가</p>
          </div>
          <div>
            <div className="text-2xl mb-1">🔗</div>
            <p className="text-xs text-gray-500">링크 연결</p>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="px-6 py-4 text-center border-t border-gray-50">
        <p className="text-xs text-gray-400">
          Powered by AI · 마이리얼트립 해커톤
        </p>
      </footer>
    </div>
  );
}

// ============================================
// Utilities
// ============================================

function isValidYoutubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
  ];

  return patterns.some((pattern) => pattern.test(url));
}
