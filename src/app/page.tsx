"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import { useCreateLink } from "@/features/links/hooks";
import { isValidYoutubeUrl } from "@/lib/utils/youtube";
import { Header } from "./_components/Header";
import { SearchInput } from "./_components/SearchInput";
import { SubmitButton } from "./_components/SubmitButton";
import { HeroSection } from "./_components/HeroSection";

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-gray-100);
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  padding: 2rem;
`;

const ErrorMessage = styled.p`
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
  line-height: 124%;
  letter-spacing: -0.02em;
  padding: 0 4px;
  color: var(--color-red-500);
`;

const ButtonWrapper = styled.div`
  margin-top: 12px;
`;

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createLink = useCreateLink();

  const handleSubmit = () => {
    setError(null);

    if (!url.trim()) {
      setError("유튜브 URL을 입력해주세요");
      return;
    }

    if (!isValidYoutubeUrl(url)) {
      setError("올바른 유튜브 URL이 아닙니다");
      return;
    }

    createLink.mutate(url);
  };

  const handleClear = () => {
    setUrl("");
    setError(null);
  };

  const handleChange = (value: string) => {
    setUrl(value);
    setError(null);
  };

  return (
    <div className="app-container">
      <Header />

      <Main>
        <ContentWrapper>
          {/* 상단 입력 영역 */}
          <SearchInput
            value={url}
            onChange={handleChange}
            onClear={handleClear}
            error={error}
            disabled={createLink.isPending}
          />

          {/* 에러 메시지 */}
          {(error || createLink.isError) && (
            <ErrorMessage>
              {error || "오류가 발생했습니다. 다시 시도해주세요."}
            </ErrorMessage>
          )}

          {/* 버튼 */}
          <ButtonWrapper>
            <SubmitButton
              onClick={handleSubmit}
              disabled={createLink.isPending}
              isLoading={createLink.isPending}
              hasValue={!!url.trim()}
            />
          </ButtonWrapper>

          <HeroSection />
        </ContentWrapper>
      </Main>
    </div>
  );
}
