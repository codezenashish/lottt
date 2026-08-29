"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getBookmarksQueryKey } from "./use-bookmarks";
import { useNotificationStore } from "@/store/useNotificationStore";

/**
 * Real-Time Multi-Device Sync Hook (PC ↔ Mobile)
 * Listens to Supabase Realtime Channel (`postgres_changes`) on the `bookmark` table
 * filtered by the user's `userId`. On INSERT, UPDATE, or DELETE, invalidates
 * the TanStack query cache and adds a live notification to the NotificationBall.
 */
export function useBookmarksRealtime(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channelName = `realtime-bookmark-sync-${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmark",
          filter: `userId=eq.${userId}`,
        },
        (payload: { eventType: string; [key: string]: unknown }) => {
          console.log(
            `[Supabase Realtime] DB event '${payload.eventType}' detected on bookmark table:`,
            payload
          );

          // Invalidate TanStack Query cache so active devices update in real-time
          // ONLY if we aren't currently mutating, to prevent overwriting optimistic updates
          const activeMutations = queryClient.isMutating({ mutationKey: ["addBookmark"] }) + 
                                  queryClient.isMutating({ mutationKey: ["updateBookmark"] }) + 
                                  queryClient.isMutating({ mutationKey: ["deleteBookmark"] }) + 
                                  queryClient.isMutating({ mutationKey: ["bulkDeleteBookmarks"] }) + 
                                  queryClient.isMutating({ mutationKey: ["bulkUpdateBookmarks"] });
          
          const pendingDeletes = queryClient.getQueryData<string[]>(["pendingDeletes"]) || [];
          
          if (activeMutations === 0 && pendingDeletes.length === 0) {
            queryClient.invalidateQueries({
              queryKey: getBookmarksQueryKey(userId),
              exact: true,
            });
          }

          // Add real-time sync notification item
          const eventLabel =
            payload.eventType === "INSERT"
              ? "New bookmark added"
              : payload.eventType === "UPDATE"
              ? "Bookmark updated"
              : "Bookmark deleted";

          useNotificationStore.getState().addNotification({
            title: `Device Synced ⚡`,
            message: `${eventLabel} on another device.`,
            type: "info",
          });
        }
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          console.log(
            `[Supabase Realtime] Successfully subscribed to bookmark changes for userId: ${userId}`
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
