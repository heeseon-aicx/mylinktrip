"use client";

import { useState } from "react";
import Image from "next/image";
import styled from "@emotion/styled";
import type { LinkItem } from "@/data/types";
import {
  formatTimestamp,
  getGoogleMapsUrl,
  getMrtSearchUrl,
  getCategoryLabel,
} from "@/lib/utils";
import { useYoutubePlayerOptional } from "./YoutubePlayerContext";

interface PlaceCardProps {
  item: LinkItem;
  videoId: string | null;
  isLast?: boolean;
  onUpdateMemo?: (memo: string | null) => void;
  onDelete?: () => void;
}

// 카테고리별 아이콘/색상
const CATEGORY_CONFIG = {
  TNA: { icon: "🎯", bgColor: "var(--color-blue-50)", color: "var(--color-blue-600)" },
  LODGING: { icon: "🏨", bgColor: "var(--color-purple-50)", color: "var(--color-purple-600)" },
};

// Styled Components
const Container = styled.div`
  display: flex;
  gap: 12px;
  position: relative;
`;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 36px;
  flex-shrink: 0;
  padding-top: 12px;
`;

const TimelineIcon = styled.div<{ bgColor: string; color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: ${(props) => props.bgColor};
  color: ${(props) => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`;

const TimelineLine = styled.div`
  width: 1px;
  flex: 1;
  background-color: var(--color-gray-200);
  margin-top: 8px;
  min-height: 20px;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
  padding-bottom: 16px;
`;

const Card = styled.div`
  padding: 12px;
  border-radius: 8px;
  background-color: var(--color-gray-50);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--color-gray-100);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PlaceName = styled.h3`
  font-weight: 500;
  color: var(--color-gray-900);
  line-height: 1.4;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-gray-500);
`;

const DeleteButton = styled.button`
  padding: 6px;
  color: var(--color-gray-400);
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--color-red-500);
    background-color: var(--color-red-50);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const YoutubeButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 12px;
  background-color: var(--color-red-50);
  color: var(--color-red-600);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--color-red-100);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const YoutuberComment = styled.p`
  font-size: 12px;
  color: var(--color-gray-500);
  margin-top: 8px;
  font-style: italic;
`;

const MemoTextarea = styled.textarea`
  width: 100%;
  resize: none;
  border-radius: 8px;
  background-color: var(--color-white);
  padding: 8px;
  font-size: 14px;
  color: var(--color-gray-900);
  border: 1px solid var(--color-gray-200);
  outline: none;
  font-family: inherit;

  &::placeholder {
    color: var(--color-gray-400);
  }

  &:focus {
    box-shadow: 0 0 0 2px var(--color-primary);
    border-color: transparent;
  }
`;

const MemoEditWrapper = styled.div`
  margin-top: 12px;
`;

const MemoButtonRow = styled.div`
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const MemoActionButton = styled.button<{ variant?: "primary" }>`
  padding: 6px 12px;
  font-size: 12px;
  font-weight: ${(props) => (props.variant === "primary" ? "500" : "400")};
  background-color: ${(props) => (props.variant === "primary" ? "var(--color-primary)" : "transparent")};
  color: ${(props) => (props.variant === "primary" ? "var(--color-white)" : "var(--color-gray-500)")};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => (props.variant === "primary" ? "var(--color-primary-hover)" : "transparent")};
    color: ${(props) => (props.variant === "primary" ? "var(--color-white)" : "var(--color-gray-700)")};
  }
`;

const MemoDisplay = styled.div<{ clickable?: boolean }>`
  margin-top: 12px;
  padding: 8px;
  border-radius: 8px;
  background-color: var(--color-blue-50);
  border: 1px solid var(--color-blue-100);
  cursor: ${(props) => (props.clickable ? "pointer" : "default")};
  transition: border-color 0.2s ease;

  &:hover {
    border-color: ${(props) => (props.clickable ? "var(--color-blue-200)" : "var(--color-blue-100)")};
  }

  p {
    font-size: 12px;
    color: var(--color-primary);
  }
`;

const AddMemoButton = styled.button`
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-gray-400);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-primary);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
`;

const ActionLink = styled.a`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-gray-700);
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--color-gray-50);
    border-color: var(--color-gray-300);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.div`
  margin: 0 16px;
  background-color: var(--color-white);
  border-radius: 16px;
  padding: 24px;
  max-width: 320px;
  width: 100%;
`;

const ModalText = styled.p`
  text-align: center;
  color: var(--color-gray-900);
  margin-bottom: 24px;

  span {
    font-weight: 600;
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const ModalButton = styled.button<{ variant?: "danger" }>`
  flex: 1;
  padding: 12px;
  font-weight: 500;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: ${(props) => (props.variant === "danger" ? "var(--color-red-500)" : "var(--color-gray-100)")};
  color: ${(props) => (props.variant === "danger" ? "var(--color-white)" : "var(--color-gray-700)")};

  &:hover {
    background-color: ${(props) => (props.variant === "danger" ? "var(--color-red-600)" : "var(--color-gray-200)")};
  }
`;

export function PlaceCard({
  item,
  videoId,
  isLast = false,
  onUpdateMemo,
  onDelete,
}: PlaceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [memo, setMemo] = useState(item.user_memo || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const youtubePlayer = useYoutubePlayerOptional();

  const config = item.category ? CATEGORY_CONFIG[item.category] : CATEGORY_CONFIG.TNA;
  const categoryLabel = getCategoryLabel(item.category);
  const timeDisplay = formatTimestamp(item.timeline_start_sec);

  const handleSaveMemo = () => {
    const trimmedMemo = memo.trim();
    onUpdateMemo?.(trimmedMemo || null);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setMemo(item.user_memo || "");
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete?.();
    setShowDeleteConfirm(false);
  };

  const handleTimestampClick = () => {
    if (!videoId || item.timeline_start_sec === null) return;

    // 플레이어가 열려있으면 해당 시간으로 이동
    if (youtubePlayer?.isOpen) {
      youtubePlayer.seekTo(item.timeline_start_sec);
    } else {
      // 플레이어가 닫혀있으면 유튜브로 이동
      window.open(
        `https://www.youtube.com/watch?v=${videoId}&t=${item.timeline_start_sec}s`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <Container>
      {/* 왼쪽: 타임라인 아이콘 */}
      <Timeline>
        <TimelineIcon bgColor={config.bgColor} color={config.color}>
          {config.icon}
        </TimelineIcon>
        {!isLast && <TimelineLine />}
      </Timeline>

      {/* 오른쪽: 내용 */}
      <Content>
        <Card>
          <CardHeader>
            <CardInfo>
              <PlaceName>{item.place_name}</PlaceName>
              <MetaRow>
                {categoryLabel && <span>{categoryLabel}</span>}
                {(item.city || item.country) && (
                  <>
                    {categoryLabel && <span>·</span>}
                    <span>{[item.city, item.country].filter(Boolean).join(", ")}</span>
                  </>
                )}
              </MetaRow>
            </CardInfo>

            {onDelete && (
              <DeleteButton onClick={() => setShowDeleteConfirm(true)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </DeleteButton>
            )}
          </CardHeader>

          {/* 유튜브 타임스탬프 버튼 */}
          {timeDisplay && videoId && (
            <YoutubeButton onClick={handleTimestampClick}>
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
              <span style={{ fontWeight: 600 }}>{timeDisplay}</span>
            </YoutubeButton>
          )}

          {/* 유튜버 코멘트 */}
          {item.youtuber_comment && <YoutuberComment>💬 "{item.youtuber_comment}"</YoutuberComment>}

          {/* 사용자 메모 - 보기/편집 모드 */}
          {isEditing ? (
            <MemoEditWrapper>
              <MemoTextarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모를 입력하세요..."
                rows={2}
                autoFocus
              />
              <MemoButtonRow>
                <MemoActionButton onClick={handleCancelEdit}>취소</MemoActionButton>
                <MemoActionButton variant="primary" onClick={handleSaveMemo}>
                  저장
                </MemoActionButton>
              </MemoButtonRow>
            </MemoEditWrapper>
          ) : item.user_memo ? (
            <MemoDisplay clickable={!!onUpdateMemo} onClick={() => onUpdateMemo && setIsEditing(true)}>
              <p>📝 {item.user_memo}</p>
            </MemoDisplay>
          ) : (
            onUpdateMemo && (
              <AddMemoButton onClick={() => setIsEditing(true)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>메모 추가</span>
              </AddMemoButton>
            )
          )}

          {/* 액션 버튼 */}
          <ActionButtons>
            <ActionLink href={getGoogleMapsUrl(item.place_name)} target="_blank" rel="noopener noreferrer">
              <Image src="/google-maps.png" alt="Google Maps" width={16} height={16} style={{ flexShrink: 0 }} />
              <span>구글맵 보기</span>
            </ActionLink>
            <ActionLink
              href={getMrtSearchUrl(item.place_name, item.city, item.category)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/myrealtrip.jpg"
                alt="MyRealTrip"
                width={16}
                height={16}
                style={{ flexShrink: 0, borderRadius: 2 }}
              />
              <span>마이리얼트립에서 보기</span>
            </ActionLink>
          </ActionButtons>
        </Card>

        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && (
          <ModalOverlay>
            <ModalContent className="animate-scale-in">
              <ModalText>
                <span>{item.place_name}</span>을(를)
                <br />
                삭제하시겠어요?
              </ModalText>
              <ModalButtons>
                <ModalButton onClick={() => setShowDeleteConfirm(false)}>취소</ModalButton>
                <ModalButton variant="danger" onClick={handleDelete}>
                  삭제
                </ModalButton>
              </ModalButtons>
            </ModalContent>
          </ModalOverlay>
        )}
      </Content>
    </Container>
  );
}
