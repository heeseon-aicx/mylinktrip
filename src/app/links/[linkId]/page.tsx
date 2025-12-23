"use client";

import { useParams, useRouter } from "next/navigation";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { useLinkDetail, useUpdateItem, useReorderItems } from "@/features/links/hooks";
import { LinkHeader, PlaceListDnD, FloatingYoutubePlayer, YoutubePlayerProvider } from "@/features/links/components";

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const PageWrapper = styled.div`
  width: 100%;
  max-width: var(--max-width);
  min-height: 100dvh;
  margin: 0 auto;
  background-color: var(--color-bg);
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-e300);
`;

const LoadingWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
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

const ErrorWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: var(--color-white);
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

  &:hover {
    background-color: var(--color-primary-hover);
  }
`;

const Main = styled.main`
  padding: 16px;
`;

const StatsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  margin-bottom: 16px;
  background-color: var(--color-gray-50);
  border-radius: 12px;
  font-size: 14px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .emoji {
    font-size: 18px;
  }

  .label {
    color: var(--color-gray-600);
  }

  .value {
    font-weight: 600;
    color: var(--color-gray-900);
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 16px;
  background-color: var(--color-gray-200);
`;

const DragTip = styled.p`
  text-align: center;
  font-size: 12px;
  color: var(--color-gray-400);
  margin-bottom: 16px;
`;

const EmptyState = styled.div`
  padding: 64px 0;
  text-align: center;

  .emoji {
    font-size: 48px;
    margin-bottom: 16px;
  }

  p {
    color: var(--color-gray-500);
  }
`;

const BottomSpacer = styled.div`
  height: 32px;
`;

export default function LinkPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = Number(params.linkId);

  const { data: link, isLoading, isError } = useLinkDetail(linkId);
  const updateItem = useUpdateItem(linkId);
  const reorderItems = useReorderItems(linkId);

  // 메모 업데이트 핸들러
  const handleUpdateMemo = (itemId: number) => (memo: string | null) => {
    updateItem.mutate({ itemId, patch: { user_memo: memo } });
  };

  // 삭제 핸들러
  const handleDelete = (itemId: number) => () => {
    updateItem.mutate({ itemId, patch: { is_deleted: true } });
  };

  // 순서 변경 핸들러
  const handleReorder = (orderedItems: { id: number; order_index: number }[]) => {
    reorderItems.mutate({ item_orders: orderedItems });
  };

  // 로딩 중
  if (isLoading) {
    return (
      <LoadingWrapper>
        <Spinner />
      </LoadingWrapper>
    );
  }

  // 에러 또는 데이터 없음
  if (isError || !link) {
    return (
      <ErrorWrapper>
        <ErrorEmoji>😕</ErrorEmoji>
        <ErrorTitle>여행 계획을 찾을 수 없어요</ErrorTitle>
        <ErrorText>잘못된 링크이거나 만료된 링크입니다</ErrorText>
        <PrimaryButton onClick={() => router.push("/")}>홈으로 돌아가기</PrimaryButton>
      </ErrorWrapper>
    );
  }

  // 아직 처리 중인 경우
  if (link.status !== "READY") {
    return (
      <ErrorWrapper>
        <ErrorEmoji>⏳</ErrorEmoji>
        <ErrorTitle>아직 분석 중이에요</ErrorTitle>
        <ErrorText>잠시 후 다시 확인해주세요</ErrorText>
        <PrimaryButton onClick={() => router.push(`/loading/${linkId}`)}>로딩 페이지로 이동</PrimaryButton>
      </ErrorWrapper>
    );
  }

  const items = link.items || [];
  const tnaCount = items.filter((i) => i.category === "TNA").length;
  const lodgingCount = items.filter((i) => i.category === "LODGING").length;

  return (
    <YoutubePlayerProvider>
      <PageWrapper>
        {/* 헤더 */}
        <LinkHeader link={link} />

        {/* 메인 콘텐츠 */}
        <Main>
          {/* 통계 바 */}
          <StatsBar>
            <StatItem>
              <span className="emoji">🎯</span>
              <span className="label">
                체험 <span className="value">{tnaCount}</span>곳
              </span>
            </StatItem>
            <Divider />
            <StatItem>
              <span className="emoji">🏨</span>
              <span className="label">
                숙소 <span className="value">{lodgingCount}</span>곳
              </span>
            </StatItem>
          </StatsBar>

          {/* 드래그 안내 */}
          {items.length > 1 && <DragTip>💡 카드를 길게 누르면 순서를 변경할 수 있어요</DragTip>}

          {/* 장소 카드 리스트 */}
          {items.length === 0 ? (
            <EmptyState>
              <div className="emoji">📍</div>
              <p>아직 추출된 장소가 없습니다</p>
            </EmptyState>
          ) : (
            <PlaceListDnD
              items={items}
              videoId={link.youtube_video_id}
              onUpdateMemo={handleUpdateMemo}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          )}

          {/* 하단 여백 */}
          <BottomSpacer />
        </Main>

        {/* 데스크톱 전용 플로팅 유튜브 플레이어 */}
        <FloatingYoutubePlayer videoId={link.youtube_video_id} youtubeUrl={link.youtube_url} />
      </PageWrapper>
    </YoutubePlayerProvider>
  );
}
