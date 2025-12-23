import type {
  CreateLinkResponse,
  LinkDetailResponse,
  UpdateItemRequest,
  UpdateItemResponse,
  ReorderRequest,
  ReorderResponse,
} from "./types";

/**
 * 데이터 소스 인터페이스
 * Mock API와 실제 API 모두 이 인터페이스를 구현
 */
export interface DataSource {
  /**
   * 링크 생성 (처리 자동 시작)
   */
  createLink(youtubeUrl: string): Promise<CreateLinkResponse>;

  /**
   * 링크 상세 조회 (items 포함)
   */
  getLinkDetail(linkId: number): Promise<LinkDetailResponse>;

  /**
   * 장소 카드 수정 (메모/삭제)
   */
  updateItem(
    linkId: number,
    itemId: number,
    patch: UpdateItemRequest
  ): Promise<UpdateItemResponse>;

  /**
   * 장소 카드 순서 변경
   */
  reorderItems(linkId: number, payload: ReorderRequest): Promise<ReorderResponse>;
}

