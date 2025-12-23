"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LinkRow, LinkPlaceItemRow } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface LinkWithItems extends LinkRow {
  link_place_items: LinkPlaceItemRow[];
}

interface UseLinkRealtimeOptions {
  /** 초기 데이터 즉시 fetch 여부, 기본값 true */
  immediate?: boolean;
  /** READY/FAILED 상태에서 구독 해제 여부, 기본값 true */
  unsubscribeOnComplete?: boolean;
}

interface UseLinkRealtimeResult {
  link: LinkWithItems | null;
  isLoading: boolean;
  error: Error | null;
  isSubscribed: boolean;
  refetch: () => Promise<void>;
}

export function useLinkRealtime(
  linkId: number | null,
  options: UseLinkRealtimeOptions = {}
): UseLinkRealtimeResult {
  const { immediate = true, unsubscribeOnComplete = true } = options;

  const [link, setLink] = useState<LinkWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const supabase = createClient();

  // 데이터 fetch 함수
  const fetchLink = useCallback(async () => {
    if (!linkId) return;

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
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
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch link"));
    } finally {
      setIsLoading(false);
    }
  }, [linkId, supabase]);

  // Realtime 구독
  useEffect(() => {
    if (!linkId) {
      setLink(null);
      setIsLoading(false);
      return;
    }

    let channel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      // 초기 데이터 fetch
      if (immediate) {
        await fetchLink();
      }

      // Realtime 구독
      channel = supabase
        .channel(`link-${linkId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "links",
            filter: `id=eq.${linkId}`,
          },
          (payload) => {
            console.log("[Realtime] Link updated:", payload);

            setLink((prev) => {
              if (!prev) return prev;

              const newData = payload.new as LinkRow;

              // READY/FAILED면 items도 다시 fetch
              if (newData.status === "READY" || newData.status === "FAILED") {
                fetchLink(); // 전체 데이터 다시 fetch (items 포함)

                // 완료 시 구독 해제
                if (unsubscribeOnComplete && channel) {
                  channel.unsubscribe();
                  setIsSubscribed(false);
                }
              }

              return {
                ...prev,
                ...newData,
              };
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "link_place_items",
            filter: `link_id=eq.${linkId}`,
          },
          (payload) => {
            console.log("[Realtime] Item changed:", payload);
            // items 변경 시 전체 refetch
            fetchLink();
          }
        )
        .subscribe((status) => {
          console.log("[Realtime] Subscription status:", status);
          setIsSubscribed(status === "SUBSCRIBED");
        });
    };

    setupRealtime();

    // Cleanup
    return () => {
      if (channel) {
        channel.unsubscribe();
        setIsSubscribed(false);
      }
    };
  }, [linkId, immediate, unsubscribeOnComplete, fetchLink, supabase]);

  return {
    link,
    isLoading,
    error,
    isSubscribed,
    refetch: fetchLink,
  };
}
