"use client";

import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
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

// 애니메이션
const slideUp = keyframes`
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// ==================== 데스크톱 스타일 ====================
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

// ==================== 모바일 바텀시트 스타일 ====================
const MobileOverlay = styled.div<{ isOpen: boolean }>`
  display: none;

  @media (max-width: ${DESKTOP_BREAKPOINT}px) {
    display: ${(props) => (props.isOpen ? "block" : "none")};
    position: fixed;
    inset: 0;
    z-index: var(--z-bottom-sheet);
    background-color: rgba(0, 0, 0, 0.5);
    animation: ${fadeIn} 0.2s ease;
  }
`;

const MobileBottomSheet = styled.div<{ isOpen: boolean; isShorts: boolean }>`
  display: none;

  @media (max-width: ${DESKTOP_BREAKPOINT}px) {
    display: ${(props) => (props.isOpen ? "flex" : "none")};
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--z-bottom-sheet);
    flex-direction: column;
    background-color: var(--color-gray-900);
    border-radius: 16px 16px 0 0;
    max-height: ${(props) => (props.isShorts ? "85vh" : "50vh")};
    animation: ${slideUp} 0.3s ease;
  }
`;

const MobileSheetHandle = styled.div`
  display: flex;
  justify-content: center;
  padding: 12px 0 8px;

  &::before {
    content: "";
    width: 36px;
    height: 4px;
    background-color: var(--color-gray-600);
    border-radius: 2px;
  }
`;

const MobileSheetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 12px;
`;

const MobileSheetTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-white);
`;

const MobileCloseButton = styled.button`
  padding: 8px;
  background: none;
  border: none;
  color: var(--color-gray-400);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover,
  &:active {
    color: var(--color-white);
    background-color: var(--color-gray-700);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const MobileVideoContainer = styled.div<{ isShorts: boolean }>`
  position: relative;
  width: 100%;
  padding-bottom: ${(props) => (props.isShorts ? "150%" : "56.25%")};
  max-height: ${(props) => (props.isShorts ? "70vh" : "none")};
  overflow: hidden;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const ToggleButton = styled.button<{ isOpen: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.isOpen ? "var(--color-gray-700)" : "var(--color-red-500)"};
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
    background-color: ${(props) =>
      props.isOpen ? "var(--color-gray-800)" : "var(--color-red-600)"};
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

// 모바일 FAB 버튼
const MobileFAB = styled.button<{ isOpen: boolean }>`
  display: none;

  @media (max-width: ${DESKTOP_BREAKPOINT}px) {
    display: ${(props) => (props.isOpen ? "none" : "flex")};
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: var(--z-sticky);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: var(--color-red-500);
    color: var(--color-white);
    border: none;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-e400);
    transition: all 0.2s ease;

    &:active {
      transform: scale(0.95);
      background-color: var(--color-red-600);
    }

    svg {
      width: 26px;
      height: 26px;
    }
  }
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

export function FloatingYoutubePlayer({
  videoId,
  youtubeUrl,
}: FloatingYoutubePlayerProps) {
  const { isOpen, currentTime, openPlayer, closePlayer } = useYoutubePlayer();
  const [iframeKey, setIframeKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const isShorts = isYoutubeShorts(youtubeUrl);

  // 화면 크기 감지 (모바일 vs 데스크톱)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= DESKTOP_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // currentTime이 변경되면 iframe을 리로드해서 해당 시간으로 이동
  useEffect(() => {
    if (currentTime !== null) {
      setTimeout(() => {
        setIframeKey((prev) => prev + 1);
      }, 100);
    }
  }, [currentTime]);

  if (!videoId) return null;

  // iframe src에 start 파라미터 추가
  const startParam = currentTime !== null ? `&start=${currentTime}` : "";
  const iframeSrc = `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1${startParam}`;

  return (
    <>
      {/* ==================== 데스크톱: 플로팅 플레이어 ==================== */}
      <FloatingContainer>
        {/* 플레이어 패널 */}
        <PlayerWrapper isOpen={isOpen} isShorts={isShorts}>
          <PlayerHeader>
            <PlayerTitle>영상 보기</PlayerTitle>
            <CloseButton onClick={closePlayer}>
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </CloseButton>
          </PlayerHeader>
          <VideoContainer isShorts={isShorts}>
            {/* 데스크톱에서만 iframe 렌더링 */}
            {isOpen && !isMobile && (
              <iframe
                key={iframeKey}
                src={iframeSrc}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </VideoContainer>
        </PlayerWrapper>

        {/* 토글 버튼 */}
        <ToggleButton
          isOpen={isOpen}
          onClick={() => (isOpen ? closePlayer() : openPlayer())}
        >
          {isOpen ? (
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          ) : (
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
          )}
        </ToggleButton>
      </FloatingContainer>

      {/* ==================== 모바일: 바텀시트 플레이어 ==================== */}
      {/* 오버레이 */}
      <MobileOverlay isOpen={isOpen} onClick={closePlayer} />

      {/* 바텀시트 */}
      <MobileBottomSheet isOpen={isOpen} isShorts={isShorts}>
        <MobileSheetHandle />
        <MobileSheetHeader>
          <MobileSheetTitle>영상 보기</MobileSheetTitle>
          <MobileCloseButton onClick={closePlayer}>
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </MobileCloseButton>
        </MobileSheetHeader>
        <MobileVideoContainer isShorts={isShorts}>
          {/* 모바일에서만 iframe 렌더링 */}
          {isOpen && isMobile && (
            <iframe
              key={`mobile-${iframeKey}`}
              src={iframeSrc}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </MobileVideoContainer>
      </MobileBottomSheet>

      {/* 모바일 FAB 버튼 */}
      <MobileFAB isOpen={isOpen} onClick={openPlayer}>
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
      </MobileFAB>
    </>
  );
}
