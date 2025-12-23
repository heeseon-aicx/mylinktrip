"use client";

import Image from "next/image";
import styled from "@emotion/styled";

const HeaderWrapper = styled.header`
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--color-gray-100);
`;

export function Header() {
  return (
    <HeaderWrapper>
      <Image
        src="/mylinktrip.png"
        alt="MyLinkTrip"
        width={100}
        height={30}
        priority
      />
    </HeaderWrapper>
  );
}
