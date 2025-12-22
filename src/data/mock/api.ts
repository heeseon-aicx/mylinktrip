import type { DataSource } from "../datasource";
import type {
  Link,
  LinkItem,
  LinkDetailResponse,
  CreateLinkResponse,
  UpdateItemRequest,
  UpdateItemResponse,
  ReorderRequest,
  ReorderResponse,
} from "../types";
import { PROGRESS_STATES } from "../types";
import { MOCK_LINK_READY_TOKYO, MOCK_TEMPLATE_ITEMS } from "./seed";
import { extractVideoId } from "@/lib/utils";

// ============================================
// In-Memory Store
// ============================================

interface MockStore {
  links: Map<number, Link>;
  items: Map<number, LinkItem[]>;
  nextLinkId: number;
  nextItemId: number;
  processingTimers: Map<number, ReturnType<typeof setInterval>>;
}

const store: MockStore = {
  links: new Map(),
  items: new Map(),
  nextLinkId: 100,
  nextItemId: 1000,
  processingTimers: new Map(),
};

// 초기 시드 데이터 로드
function initializeStore() {
  // READY 상태 링크 (id=1)
  const readyLink: Link = { ...MOCK_LINK_READY_TOKYO };
  store.links.set(1, readyLink);
  store.items.set(1, [...MOCK_LINK_READY_TOKYO.items]);
}

// 스토어 초기화
initializeStore();

// ============================================
// 처리 시뮬레이션
// ============================================

function startProcessingSimulation(linkId: number, url: string) {
  let step = 0;

  // 실패 시뮬레이션: URL에 'fail' 포함 시
  const shouldFail = url.toLowerCase().includes("fail");

  const timer = setInterval(() => {
    const link = store.links.get(linkId);
    if (!link) {
      clearInterval(timer);
      store.processingTimers.delete(linkId);
      return;
    }

    // 실패 처리
    if (shouldFail && step >= 2) {
      store.links.set(linkId, {
        ...link,
        status: "FAILED",
        error_code: "YT_FETCH_FAILED",
        error_message: "비공개 영상이거나 삭제된 영상입니다",
        updated_at: new Date().toISOString(),
      });
      clearInterval(timer);
      store.processingTimers.delete(linkId);
      return;
    }

    const state = PROGRESS_STATES[step];
    if (!state) {
      clearInterval(timer);
      store.processingTimers.delete(linkId);
      return;
    }

    // 상태 업데이트
    store.links.set(linkId, {
      ...link,
      status: state.status,
      progress_pct: state.progress_pct,
      stage: state.stage,
      status_message: state.status_message,
      updated_at: new Date().toISOString(),
    });

    // READY 도달 시 items 생성
    if (state.status === "READY") {
      const now = new Date().toISOString();
      const items: LinkItem[] = MOCK_TEMPLATE_ITEMS.map((item, idx) => ({
        ...item,
        id: store.nextItemId++,
        link_id: linkId,
        created_at: now,
        updated_at: now,
      }));
      store.items.set(linkId, items);

      // 링크 정보도 업데이트
      store.links.set(linkId, {
        ...store.links.get(linkId)!,
        title_ai: "도쿄 3박4일 완벽 가이드 🗼 맛집 & 관광지 총정리",
        youtube_channel_name: "여행에미치다",
        youtube_channel_id: "UC1234567890",
      });

      clearInterval(timer);
      store.processingTimers.delete(linkId);
    }

    step++;
  }, 1500); // 1.5초 간격

  store.processingTimers.set(linkId, timer);
}

// ============================================
// Mock API Implementation
// ============================================

export const mockApi: DataSource = {
  /**
   * 링크 생성 (처리 자동 시작)
   */
  async createLink(youtubeUrl: string): Promise<CreateLinkResponse> {
    // 시뮬레이션 딜레이
    await delay(300);

    const id = store.nextLinkId++;
    const now = new Date().toISOString();

    const newLink: Link = {
      id,
      youtube_url: youtubeUrl,
      youtube_video_id: extractVideoId(youtubeUrl),
      youtube_channel_name: null,
      youtube_channel_id: null,
      title_ai: null,
      title_user: null,
      status: "PENDING",
      progress_pct: 0,
      stage: null,
      status_message: "분석 대기 중...",
      error_code: null,
      error_message: null,
      created_at: now,
      updated_at: now,
    };

    store.links.set(id, newLink);

    // 자동 처리 시작
    startProcessingSimulation(id, youtubeUrl);

    return { id };
  },

  /**
   * 링크 상세 조회 (items 포함)
   */
  async getLinkDetail(linkId: number): Promise<LinkDetailResponse> {
    // 시뮬레이션 딜레이
    await delay(100);

    const link = store.links.get(linkId);
    if (!link) {
      throw new Error(`Link not found: ${linkId}`);
    }

    const items = (store.items.get(linkId) || [])
      .filter((item) => !item.is_deleted)
      .sort((a, b) => a.order_index - b.order_index);

    return { ...link, items };
  },

  /**
   * 장소 카드 수정 (메모/삭제)
   */
  async updateItem(
    linkId: number,
    itemId: number,
    patch: UpdateItemRequest
  ): Promise<UpdateItemResponse> {
    // 시뮬레이션 딜레이
    await delay(200);

    const items = store.items.get(linkId);
    if (!items) {
      throw new Error(`Link not found: ${linkId}`);
    }

    const itemIndex = items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) {
      throw new Error(`Item not found: ${itemId}`);
    }

    const now = new Date().toISOString();
    const updatedItem: LinkItem = {
      ...items[itemIndex],
      ...(patch.user_memo !== undefined && { user_memo: patch.user_memo }),
      ...(patch.is_deleted !== undefined && { is_deleted: patch.is_deleted }),
      updated_at: now,
    };

    items[itemIndex] = updatedItem;

    return {
      id: updatedItem.id,
      place_name: updatedItem.place_name,
      user_memo: updatedItem.user_memo,
      order_index: updatedItem.order_index,
      is_deleted: updatedItem.is_deleted,
      updated_at: updatedItem.updated_at,
    };
  },

  /**
   * 장소 카드 순서 변경
   */
  async reorderItems(
    linkId: number,
    payload: ReorderRequest
  ): Promise<ReorderResponse> {
    // 시뮬레이션 딜레이
    await delay(200);

    const items = store.items.get(linkId);
    if (!items) {
      throw new Error(`Link not found: ${linkId}`);
    }

    let updatedCount = 0;
    const now = new Date().toISOString();

    payload.item_orders.forEach(({ id, order_index }) => {
      const item = items.find((i) => i.id === id);
      if (item) {
        item.order_index = order_index;
        item.updated_at = now;
        updatedCount++;
      }
    });

    return { success: true, updated_count: updatedCount };
  },
};

// ============================================
// Utilities
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 스토어 리셋 (테스트용)
export function resetMockStore() {
  store.links.clear();
  store.items.clear();
  store.nextLinkId = 100;
  store.nextItemId = 1000;

  // 진행 중인 타이머 정리
  store.processingTimers.forEach((timer) => clearInterval(timer));
  store.processingTimers.clear();

  // 초기 데이터 다시 로드
  initializeStore();
}

