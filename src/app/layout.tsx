import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/lib/queryClient";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          {/* 모바일 중앙 정렬 컨테이너 */}
          <div className="mx-auto max-w-lg min-h-screen bg-white shadow-sm">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
