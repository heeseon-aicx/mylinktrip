"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LinkRow, LinkPlaceItemRow } from "@/types/database";

interface LinkWithItems extends LinkRow {
  link_place_items: LinkPlaceItemRow[];
}

interface UseLinkPollingOptions {
  /** 폴링 간격 (ms), 기본값 2000ms */
  interval?: number;
  /** READY/FAILED 상태에서 폴링 중지 여부, 기본값 true */
  stopOnComplete?: boolean;
  /** 즉시 첫 fetch 실행 여부, 기본값 true */
  immediate?: boolean;
}

interface UseLinkPollingResult {
  link: LinkWithItems | null;
  isLoading: boolean;
  error: Error | null;
  isPolling: boolean;
  refetch: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

export function useLinkPolling(
  linkId: number | null,
  options: UseLinkPollingOptions = {}
): UseLinkPollingResult {
  const { interval = 2000, stopOnComplete = true, immediate = true } = options;

  const [link, setLink] = useState<LinkWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabaseRef = useRef(createClient());

  // 폴링 중지
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // 데이터 fetch 함수
  const fetchLink = useCallback(async () => {
    if (!linkId) return;

    try {
      const { data, error: fetchError } = await supabaseRef.current
        .from("links")
        .select(
          `
          *,
          link_place_items (*)
        `
        )
        .eq("id", linkId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error("Link not found");

      // items를 order_index로 정렬하고 삭제된 것 필터링
      const linkData = data as LinkRow & {
        link_place_items?: LinkPlaceItemRow[];
      };
      const sortedData: LinkWithItems = {
        ...linkData,
        link_place_items: (linkData.link_place_items || [])
          .filter((item) => !item.is_deleted)
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
      };

      setLink(sortedData);
      setError(null);

      // READY 또는 FAILED면 폴링 중지
      if (
        stopOnComplete &&
        (linkData.status === "READY" || linkData.status === "FAILED")
      ) {
        stopPolling();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch link"));
    } finally {
      setIsLoading(false);
    }
  }, [linkId, stopOnComplete, stopPolling]);

  // 폴링 시작
  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // 이미 폴링 중

    setIsPolling(true);
    intervalRef.current = setInterval(fetchLink, interval);
  }, [fetchLink, interval]);

  // 수동 refetch
  const refetch = useCallback(async () => {
    setIsLoading(true);
    await fetchLink();
  }, [fetchLink]);

  // 초기 fetch 및 폴링 시작
  useEffect(() => {
    if (!linkId) {
      setLink(null);
      setIsLoading(false);
      return;
    }

    if (immediate) {
      fetchLink();
    }

    startPolling();

    return () => {
      stopPolling();
    };
  }, [linkId, immediate, fetchLink, startPolling, stopPolling]);

  // link 상태 변경 시 폴링 제어
  useEffect(() => {
    if (!link) return;

    if (
      stopOnComplete &&
      (link.status === "READY" || link.status === "FAILED")
    ) {
      stopPolling();
    } else if (link.status === "PENDING" || link.status === "PROCESSING") {
      if (!isPolling) startPolling();
    }
  }, [link, stopOnComplete, isPolling, startPolling, stopPolling]);

  return {
    link,
    isLoading,
    error,
    isPolling,
    refetch,
    startPolling,
    stopPolling,
  };
}
