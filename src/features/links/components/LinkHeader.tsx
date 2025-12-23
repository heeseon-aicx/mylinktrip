"use client";

import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import type { Link } from "@/data/types";

interface LinkHeaderProps {
  link: Link;
}

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-gray-100);
`;

const NavRow = styled.div`
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 16px;
`;

const NavButton = styled.button<{ side: "left" | "right" }>`
  width: 40px;
  height: 40px;
  margin-left: ${(props) => (props.side === "left" ? "-8px" : "0")};
  margin-right: ${(props) => (props.side === "right" ? "-8px" : "0")};
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gray-600);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-gray-900);
  }

  svg {
    width: ${(props) => (props.side === "left" ? "24px" : "20px")};
    height: ${(props) => (props.side === "left" ? "24px" : "20px")};
  }
`;

const Title = styled.h1`
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-gray-900);
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SubInfo = styled.div`
  padding: 0 16px 12px;
`;

const ChannelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-red-500);

  svg {
    width: 16px;
    height: 16px;
  }
`;

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
    <Header>
      {/* 상단 네비게이션 */}
      <NavRow>
        {/* 뒤로가기 */}
        <NavButton side="left" onClick={() => router.push("/")}>
          <svg
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
        </NavButton>

        {/* 제목 */}
        <Title>{title}</Title>

        {/* 공유 버튼 */}
        <NavButton side="right" onClick={handleShare}>
          <svg
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
        </NavButton>
      </NavRow>

      {/* 서브 정보 */}
      <SubInfo>
        <ChannelRow>
          {link.youtube_channel_name && (
            <>
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
              <span>{link.youtube_channel_name}</span>
            </>
          )}
        </ChannelRow>
      </SubInfo>
    </Header>
  );
}
