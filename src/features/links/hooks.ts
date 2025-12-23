"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/data/api";
import type {
  LinkDetailResponse,
  UpdateItemRequest,
  ReorderRequest,
} from "@/data/types";

// ============================================
// Query Keys
// ============================================

export const linkKeys = {
  all: ["links"] as const,
  detail: (id: number) => ["link", id] as const,
};

// ============================================
// Queries
// ============================================

/**
 * 링크 상세 조회 (폴링 지원)
 */
export function useLinkDetail(linkId: number, options?: { polling?: boolean }) {
  return useQuery({
    queryKey: linkKeys.detail(linkId),
    queryFn: () => api.getLinkDetail(linkId),
    refetchInterval: (query) => {
      if (!options?.polling) return false;

      const status = query.state.data?.status;
      // READY/FAILED면 폴링 중지
      if (status === "READY" || status === "FAILED") return false;
      return 1500; // 1.5초 간격
    },
  });
}

// ============================================
// Mutations
// ============================================

/**
 * 링크 생성 mutation
 */
export function useCreateLink() {
  const router = useRouter();

  return useMutation({
    mutationFn: (youtubeUrl: string) => api.createLink(youtubeUrl),
    onSuccess: (data) => {
      router.push(`/loading/${data.id}`);
    },
  });
}

/**
 * 장소 카드 수정 mutation (메모/삭제)
 */
export function useUpdateItem(linkId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      patch,
    }: {
      itemId: number;
      patch: UpdateItemRequest;
    }) => api.updateItem(linkId, itemId, patch),

    // Optimistic Update
    onMutate: async ({ itemId, patch }) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: linkKeys.detail(linkId) });

      // 이전 상태 저장
      const previousData = queryClient.getQueryData<LinkDetailResponse>(
        linkKeys.detail(linkId)
      );

      // Optimistic update
      queryClient.setQueryData<LinkDetailResponse>(
        linkKeys.detail(linkId),
        (old) => {
          if (!old) return old;

          // 삭제인 경우 items에서 제거
          if (patch.is_deleted) {
            return {
              ...old,
              items: old.items.filter((item) => item.id !== itemId),
            };
          }

          // 메모 수정인 경우
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === itemId
                ? { ...item, ...patch, updated_at: new Date().toISOString() }
                : item
            ),
          };
        }
      );

      return { previousData };
    },

    // 에러 시 롤백
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(linkKeys.detail(linkId), context.previousData);
      }
    },

    // 성공/에러 후 항상 재조회
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(linkId) });
    },
  });
}

/**
 * 장소 카드 순서 변경 mutation
 */
export function useReorderItems(linkId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReorderRequest) => api.reorderItems(linkId, payload),

    // Optimistic Update
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: linkKeys.detail(linkId) });

      const previousData = queryClient.getQueryData<LinkDetailResponse>(
        linkKeys.detail(linkId)
      );

      queryClient.setQueryData<LinkDetailResponse>(
        linkKeys.detail(linkId),
        (old) => {
          if (!old) return old;

          const orderMap = new Map(
            payload.item_orders.map((o) => [o.id, o.order_index])
          );

          const updatedItems = old.items
            .map((item) => ({
              ...item,
              order_index: orderMap.get(item.id) ?? item.order_index,
            }))
            .sort((a, b) => a.order_index - b.order_index);

          return { ...old, items: updatedItems };
        }
      );

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(linkKeys.detail(linkId), context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(linkId) });
    },
  });
}
