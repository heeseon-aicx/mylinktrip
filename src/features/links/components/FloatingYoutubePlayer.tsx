"use client";

import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { useYoutubePlayer } from "./YoutubePlayerContext";

interface FloatingYoutubePlayerProps {
  videoId: string | null;
  youtubeUrl: string;
}

const DESKTOP_BREAKPOINT = 768;

// 쇼츠 URL인지 확인
function isYoutubeShorts(url: string): boolean {
  return url.includes("/shorts/");
}

const FloatingContainer = styled.div`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;

  /* 모바일에서는 숨김 */
  @media (max-width: ${DESKTOP_BREAKPOINT}px) {
    display: none;
  }
`;

const ToggleButton = styled.button<{ isOpen: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${(props) => (props.isOpen ? "var(--color-gray-700)" : "var(--color-red-500)")};
  color: var(--color-white);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-e400);
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    background-color: ${(props) => (props.isOpen ? "var(--color-gray-800)" : "var(--color-red-600)")};
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const PlayerWrapper = styled.div<{ isOpen: boolean; isShorts: boolean }>`
  width: ${(props) => (props.isShorts ? "280px" : "400px")};
  background-color: var(--color-gray-900);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-e500);
  transform-origin: bottom right;
  transition: all 0.3s ease;
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
  transform: ${(props) => (props.isOpen ? "scale(1)" : "scale(0.9)")};
  pointer-events: ${(props) => (props.isOpen ? "auto" : "none")};
  display: ${(props) => (props.isOpen ? "block" : "none")};
`;

const VideoContainer = styled.div<{ isShorts: boolean }>`
  position: relative;
  width: 100%;
  /* 16:9 = 56.25%, 9:16 = 177.78% */
  padding-bottom: ${(props) => (props.isShorts ? "177.78%" : "56.25%")};

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--color-gray-800);
`;

const PlayerTitle = styled.span`
  font-size: 12px;
  color: var(--color-gray-300);
  font-weight: 500;
`;

const CloseButton = styled.button`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-gray-400);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: var(--color-white);
    background-color: var(--color-gray-700);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export function FloatingYoutubePlayer({ videoId, youtubeUrl }: FloatingYoutubePlayerProps) {
  const { isOpen, currentTime, openPlayer, closePlayer } = useYoutubePlayer();
  const [iframeKey, setIframeKey] = useState(0);

  const isShorts = isYoutubeShorts(youtubeUrl);

  // currentTime이 변경되면 iframe을 리로드해서 해당 시간으로 이동
  useEffect(() => {
    if (currentTime !== null) {
      setIframeKey((prev) => prev + 1);
    }
  }, [currentTime]);

  if (!videoId) return null;

  // iframe src에 start 파라미터 추가
  const startParam = currentTime !== null ? `&start=${currentTime}` : "";
  const iframeSrc = `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1${startParam}`;

  return (
    <FloatingContainer>
      {/* 플레이어 패널 */}
      <PlayerWrapper isOpen={isOpen} isShorts={isShorts}>
        <PlayerHeader>
          <PlayerTitle>{isShorts ? "📱 쇼츠 보기" : "📺 영상 보기"}</PlayerTitle>
          <CloseButton onClick={closePlayer}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </CloseButton>
        </PlayerHeader>
        <VideoContainer isShorts={isShorts}>
          <iframe
            key={iframeKey}
            src={iframeSrc}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </VideoContainer>
      </PlayerWrapper>

      {/* 토글 버튼 */}
      <ToggleButton isOpen={isOpen} onClick={() => (isOpen ? closePlayer() : openPlayer())}>
        {isOpen ? (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
          </svg>
        )}
      </ToggleButton>
    </FloatingContainer>
  );
}
