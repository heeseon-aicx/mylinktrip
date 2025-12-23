"use client";

import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

interface SubmitButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  hasValue?: boolean;
}

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Button = styled.button<{ hasValue?: boolean }>`
  height: 44px;
  padding: 0 20px;
  font-size: 15px;
  font-weight: 600;
  line-height: 138%;
  letter-spacing: -0.02em;
  border-radius: 9999px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: ${(props) =>
    props.hasValue ? "none" : "1px solid var(--color-gray-200)"};
  background-color: ${(props) =>
    props.hasValue ? "var(--color-gray-900)" : "var(--color-gray-100)"};
  color: ${(props) =>
    props.hasValue ? "var(--color-white)" : "var(--color-gray-400)"};

  &:hover:not(:disabled) {
    background-color: ${(props) =>
      props.hasValue ? "var(--color-gray-800)" : "var(--color-gray-100)"};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const LoadingWrapper = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Spinner = styled.svg`
  height: 16px;
  width: 16px;
  animation: ${spin} 1s linear infinite;
`;

export function SubmitButton({
  onClick,
  disabled,
  isLoading,
  hasValue,
}: SubmitButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      hasValue={hasValue}
    >
      {isLoading ? (
        <LoadingWrapper>
          <Spinner fill="none" viewBox="0 0 24 24">
            <circle
              style={{ opacity: 0.25 }}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              style={{ opacity: 0.75 }}
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </Spinner>
          분석 중...
        </LoadingWrapper>
      ) : (
        "여행 계획 만들기"
      )}
    </Button>
  );
}
