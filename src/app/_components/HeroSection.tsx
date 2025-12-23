"use client";

import styled from "@emotion/styled";

interface FeatureItemProps {
  icon: React.ReactNode;
  label: string;
  bgColor: string;
  textColor: string;
}

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
`;

const YoutubeIcon = styled.div`
  width: 96px;
  height: 96px;
  background-color: var(--color-red-50);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;

  svg {
    width: 48px;
    height: 48px;
    color: var(--color-red-500);
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  line-height: 124%;
  letter-spacing: -0.01em;
  color: var(--color-gray-900);
  text-align: center;
  margin-bottom: 12px;
`;

const Subtitle = styled.p`
  font-size: 15px;
  font-weight: 500;
  line-height: 138%;
  letter-spacing: -0.01em;
  color: var(--color-gray-600);
  text-align: center;
  margin-bottom: 48px;
`;

const FeaturesRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
`;

const FeatureItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const FeatureIconBox = styled.div<{ bgColor: string; textColor: string }>`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.bgColor};
  color: ${(props) => props.textColor};

  svg {
    width: 24px;
    height: 24px;
  }
`;

const FeatureLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  line-height: 124%;
  letter-spacing: -0.02em;
  color: var(--color-gray-500);
`;

function FeatureItem({ icon, label, bgColor, textColor }: FeatureItemProps) {
  return (
    <FeatureItemWrapper>
      <FeatureIconBox bgColor={bgColor} textColor={textColor}>
        {icon}
      </FeatureIconBox>
      <FeatureLabel>{label}</FeatureLabel>
    </FeatureItemWrapper>
  );
}

export function HeroSection() {
  return (
    <Container>
      {/* 유튜브 아이콘 */}
      <YoutubeIcon>
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
      </YoutubeIcon>

      {/* 타이틀 */}
      <Title>
        유튜브 영상을
        <br />
        여행 계획으로 바꿔보세요
      </Title>
      <Subtitle>영상 속 장소를 AI가 자동으로 추출해드려요</Subtitle>

      {/* 기능 아이콘 */}
      <FeaturesRow>
        <FeatureItem
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="10" r="3" />
              <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" />
            </svg>
          }
          label="장소 추출"
          bgColor="#E8F6F3"
          textColor="#1A9E85"
        />
        <FeatureItem
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              <path d="M9 12h6M9 16h6" />
            </svg>
          }
          label="메모 추가"
          bgColor="#FEF9E7"
          textColor="#B45309"
        />
        <FeatureItem
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          }
          label="예약 연결"
          bgColor="#FFF5F0"
          textColor="#E85D3B"
        />
      </FeaturesRow>
    </Container>
  );
}
