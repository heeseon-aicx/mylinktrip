import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/lib/queryClient";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyLinkTrip - 유튜브 여행 영상을 여행 계획으로",
  description:
    "유튜브 여행 브이로그 링크를 넣으면, 영상 속 장소들을 추출해 보기 좋은 여행 계획으로 변환해주는 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard 폰트 CDN */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="antialiased">
        <QueryProvider>
          {/* 모바일 중앙 정렬 컨테이너 */}
          <div className="mx-auto max-w-lg min-h-screen bg-gray-0 shadow-sm">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
