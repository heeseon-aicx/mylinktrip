"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { useLinkDetail, useCreateLink } from "@/features/links/hooks";
import type { LinkStage } from "@/data/types";

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(0.9);
  }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: var(--color-white);
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 2px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const ErrorEmoji = styled.div`
  font-size: 60px;
  margin-bottom: 16px;
`;

const ErrorTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: 8px;
`;

const ErrorText = styled.p`
  color: var(--color-gray-500);
  text-align: center;
  margin-bottom: 24px;
  max-width: 280px;
`;

const PrimaryButton = styled.button`
  padding: 12px 24px;
  background-color: var(--color-primary);
  color: var(--color-white);
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  width: 100%;
  max-width: 280px;

  &:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  padding: 12px 24px;
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
  font-weight: 500;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  width: 100%;
  max-width: 280px;

  &:hover {
    background-color: var(--color-gray-200);
  }
`;

const ErrorIconWrapper = styled.div`
  width: 64px;
  height: 64px;
  background-color: var(--color-red-50);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;

  svg {
    width: 32px;
    height: 32px;
    color: var(--color-red-500);
  }
`;

const ErrorCodeBadge = styled.div`
  margin-bottom: 24px;
  padding: 6px 12px;
  background-color: var(--color-gray-100);
  border-radius: 8px;
  font-size: 12px;
  color: var(--color-gray-500);
`;

const ButtonStack = styled.div`
  width: 100%;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LoadingIconWrapper = styled.div`
  margin-bottom: 32px;
`;

const LoadingIcon = styled.div`
  width: 64px;
  height: 64px;
  background-color: var(--color-red-50);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 32px;
    height: 32px;
    color: var(--color-red-500);
    animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

const LoadingTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: var(--color-gray-900);
  margin-bottom: 8px;
`;

const LoadingText = styled.p`
  color: var(--color-gray-500);
  font-size: 14px;
  margin-bottom: 32px;
`;

const ProgressWrapper = styled.div`
  width: 100%;
  max-width: 280px;
  margin-bottom: 32px;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-gray-500);
  margin-bottom: 8px;
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: var(--color-gray-100);
  border-radius: 9999px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ width: number }>`
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 9999px;
  transition: width 0.5s ease;
  width: ${(props) => props.width}%;
`;

const StagesWrapper = styled.div`
  width: 100%;
  max-width: 280px;
  background-color: var(--color-gray-50);
  border-radius: 12px;
  padding: 16px;
`;

const StagesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StageItemWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StageIcon = styled.div<{ status: "complete" | "active" | "pending" }>`
  display: flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.2s ease;
  background-color: ${(props) =>
    props.status === "complete"
      ? "var(--color-green-500)"
      : props.status === "active"
        ? "var(--color-primary)"
        : "var(--color-gray-200)"};

  svg {
    width: 14px;
    height: 14px;
    color: var(--color-white);
  }
`;

const StageDot = styled.div<{ active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) => (props.active ? "var(--color-white)" : "var(--color-gray-400)")};
  animation: ${(props) => (props.active ? pulse : "none")} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const StageLabel = styled.span<{ status: "complete" | "active" | "pending" }>`
  flex: 1;
  font-size: 14px;
  transition: color 0.2s ease;
  color: ${(props) =>
    props.status === "complete"
      ? "var(--color-green-600)"
      : props.status === "active"
        ? "var(--color-gray-900)"
        : "var(--color-gray-400)"};
  font-weight: ${(props) => (props.status === "active" ? "500" : "400")};
`;

const StageStatus = styled.span`
  font-size: 12px;
  color: var(--color-primary);
`;

const CancelLink = styled.button`
  margin-top: 32px;
  font-size: 14px;
  color: var(--color-gray-400);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-gray-600);
  }
`;

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
      <PageWrapper>
        <Spinner />
      </PageWrapper>
    );
  }

  // 에러
  if (isError || !link) {
    return (
      <PageWrapper>
        <ErrorEmoji>😕</ErrorEmoji>
        <ErrorTitle>링크를 찾을 수 없어요</ErrorTitle>
        <ErrorText>잘못된 링크이거나 만료된 링크입니다</ErrorText>
        <PrimaryButton onClick={() => router.push("/")}>홈으로 돌아가기</PrimaryButton>
      </PageWrapper>
    );
  }

  // 실패 상태
  if (link.status === "FAILED") {
    return (
      <PageWrapper>
        <ErrorIconWrapper>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </ErrorIconWrapper>

        <ErrorTitle>분석 실패</ErrorTitle>

        <ErrorText>{link.error_message || "영상을 분석하는 중 오류가 발생했습니다"}</ErrorText>

        {link.error_code && <ErrorCodeBadge>에러 코드: {link.error_code}</ErrorCodeBadge>}

        <ButtonStack>
          <PrimaryButton onClick={handleRetry} disabled={createLink.isPending}>
            {createLink.isPending ? "재시도 중..." : "다시 시도하기"}
          </PrimaryButton>
          <SecondaryButton onClick={() => router.push("/")}>다른 영상으로 시도하기</SecondaryButton>
        </ButtonStack>
      </PageWrapper>
    );
  }

  // 처리 중 상태
  return (
    <PageWrapper>
      {/* 로딩 아이콘 */}
      <LoadingIconWrapper>
        <LoadingIcon>
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
          </svg>
        </LoadingIcon>
      </LoadingIconWrapper>

      {/* 상태 메시지 */}
      <LoadingTitle>영상을 분석하고 있어요</LoadingTitle>
      <LoadingText>잠시만 기다려주세요</LoadingText>

      {/* 프로그레스 바 */}
      <ProgressWrapper>
        <ProgressHeader>
          <span>{link.status_message || "분석 중..."}</span>
          <span>{link.progress_pct}%</span>
        </ProgressHeader>
        <ProgressBar>
          <ProgressFill width={link.progress_pct} />
        </ProgressBar>
      </ProgressWrapper>

      {/* 단계 체크리스트 */}
      <StagesWrapper>
        <StagesList>
          <StageItem stage="fetch_meta" currentStage={link.stage} progress={link.progress_pct} label="영상 정보 확인" stageOrder={1} />
          <StageItem stage="extract_places" currentStage={link.stage} progress={link.progress_pct} label="장소 추출" stageOrder={2} />
          <StageItem stage="persist" currentStage={link.stage} progress={link.progress_pct} label="여행 계획 정리" stageOrder={3} />
        </StagesList>
      </StagesWrapper>

      {/* 취소 버튼 */}
      <CancelLink onClick={() => router.push("/")}>취소하고 돌아가기</CancelLink>
    </PageWrapper>
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
  stageOrder: number; // 1, 2, 3
}

// stage 순서 매핑
const STAGE_ORDER: Record<LinkStage, number> = {
  fetch_meta: 1,
  extract_places: 2,
  persist: 3,
};

function StageItem({ stage, currentStage, progress, label, stageOrder }: StageItemProps) {
  const currentOrder = currentStage ? STAGE_ORDER[currentStage] : 0;
  
  // 현재 stage의 순서가 이 stage보다 크면 완료
  // progress가 100이면 모든 단계 완료
  const isComplete = progress >= 100 || currentOrder > stageOrder;
  const isActive = currentStage === stage;

  const status = isComplete ? "complete" : isActive ? "active" : "pending";

  return (
    <StageItemWrapper>
      {/* 상태 아이콘 */}
      <StageIcon status={status}>
        {isComplete ? (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <StageDot active={isActive} />
        )}
      </StageIcon>

      {/* 라벨 */}
      <StageLabel status={status}>{label}</StageLabel>

      {/* 상태 텍스트 */}
      {isActive && <StageStatus>진행 중</StageStatus>}
    </StageItemWrapper>
  );
}
