import type { DataSource } from "../datasource";
import { realApi } from "./client";
import { mockApi } from "../mock/api";

// ============================================
// API Source Selection
// ============================================

/**
 * 환경에 따라 Mock API 또는 Real API 선택
 *
 * - USE_MOCK_API=true: Mock API 사용 (개발/테스트용)
 * - USE_MOCK_API=false 또는 미설정: Real API 사용
 */
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

export const api: DataSource = USE_MOCK_API ? mockApi : realApi;

// 개별 export (필요시)
export { realApi } from "./client";
export { mockApi } from "../mock/api";

