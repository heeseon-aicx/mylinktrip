import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/lib/queryClient";
import "./reset.css";
import "./theme.css";
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
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
