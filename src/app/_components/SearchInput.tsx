"use client";

import styled from "@emotion/styled";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  error?: string | null;
  disabled?: boolean;
}

const InputWrapper = styled.div<{ hasError?: boolean }>`
  display: flex;
  align-items: center;
  height: 48px;
  width: 100%;
  padding: 0 16px;
  border-radius: 12px;
  transition: all 0.2s ease;
  border: 1px solid
    ${(props) =>
      props.hasError ? "var(--color-red-400)" : "var(--color-gray-200)"};
  background-color: ${(props) =>
    props.hasError ? "var(--color-white)" : "var(--color-gray-50)"};

  &:focus-within {
    border-color: ${(props) =>
      props.hasError ? "var(--color-red-400)" : "var(--color-gray-500)"};
  }
`;

const Input = styled.input`
  flex: 1;
  background: transparent;
  font-size: 15px;
  font-weight: 500;
  line-height: 138%;
  letter-spacing: -0.01em;
  color: var(--color-gray-900);
  border: none;
  outline: none;

  &::placeholder {
    color: var(--color-gray-400);
  }

  &:disabled {
    opacity: 0.6;
  }
`;

const ClearButton = styled.button`
  padding: 4px;
  color: var(--color-gray-400);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-gray-600);
  }
`;

const IconWrapper = styled.div`
  margin-left: 8px;
  color: var(--color-gray-400);
`;

const Icon = styled.svg`
  width: 20px;
  height: 20px;
`;

export function SearchInput({
  value,
  onChange,
  onClear,
  error,
  disabled,
}: SearchInputProps) {
  return (
    <InputWrapper hasError={!!error}>
      <Input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="유튜브 링크를 붙여넣으세요"
        disabled={disabled}
      />
      {value ? (
        <ClearButton type="button" onClick={onClear}>
          <Icon
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
          </Icon>
        </ClearButton>
      ) : (
        <IconWrapper>
          <Icon
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </Icon>
        </IconWrapper>
      )}
    </InputWrapper>
  );
}
