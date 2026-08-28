"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  getBookmarksAction,
  createBookmarkAction,
  updateBookmarkAction,
  deleteBookmarkAction,
  bulkDeleteBookmarksAction,
  bulkUpdateBookmarksAction,
  CreateBookmarkInput,
  UpdateBookmarkInput,
} from "@/app/actions/bookmarks";
import { BookmarkItem } from "@/features/bookmarks/components/bookmark-card";

const EMPTY_BOOKMARKS: BookmarkItem[] = [];

// Helper function to resolve active query key
export function getBookmarksQueryKey(userId?: string) {
  return userId ? ["bookmarks", userId] : ["bookmarks"];
}

/**
 * Custom hook for bookmark management with 0ms perceived latency (Optimistic UI)
 * and seamless TanStack Query v5 cache management.
 */
export function useBookmarks(userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = getBookmarksQueryKey(userId);

  // ----------------------------------------------------
  // 1. QUERY: Fetch Bookmarks
  // ----------------------------------------------------
  const query = useQuery<BookmarkItem[]>({
    queryKey,
    queryFn: async () => {
      const data = await getBookmarksAction(userId);
      return data as unknown as BookmarkItem[];
    },
    staleTime: 1000 * 60 * 5, // 5 Minutes fresh cache
    gcTime: 1000 * 60 * 30, // 30 Minutes garbage collection
  });

  // ----------------------------------------------------
  // 2. MUTATION: Optimistic Add Bookmark
  // ----------------------------------------------------
  const addMutation = useMutation({
    mutationKey: ["addBookmark"],
    mutationFn: async (newBookmarkInput: CreateBookmarkInput) => {
      const result = await createBookmarkAction(newBookmarkInput);
      return result as unknown as BookmarkItem;
    },
    onMutate: async (newBookmarkInput) => {
      await queryClient.cancelQueries({ queryKey });

      const optimisticBookmark: BookmarkItem = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: newBookmarkInput.title.trim(),
        url: newBookmarkInput.url.trim(),
        description: newBookmarkInput.description || null,
        favicon:
          newBookmarkInput.favicon ||
          `https://www.google.com/s2/favicons?domain=${
            newBookmarkInput.url.replace(/^https?:\/\//i, "").split("/")[0]
          }&sz=128`,
        userId: userId || "current-user",
        categoryId: newBookmarkInput.categoryId || null,
        category: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) => [
        optimisticBookmark,
        ...old,
      ]);

      return { tempId: optimisticBookmark.id };
    },
    onError: (err, _newBookmark, context) => {
      if (context?.tempId) {
        queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) =>
          old.filter(bm => bm.id !== context.tempId)
        );
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to add bookmark. Rolled back changes."
      );
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: ["addBookmark"] }) <= 1) {
        queryClient.invalidateQueries({ queryKey });
        if (userId) {
          queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
        }
      }
    },
  });

  // ----------------------------------------------------
  // 3. MUTATION: Optimistic Update Bookmark
  // ----------------------------------------------------
  const updateMutation = useMutation({
    mutationKey: ["updateBookmark"],
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateBookmarkInput;
    }) => {
      const result = await updateBookmarkAction(id, input);
      return result as unknown as BookmarkItem;
    },
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousBookmarks =
        queryClient.getQueryData<BookmarkItem[]>(queryKey) || [];
      const previousItem = previousBookmarks.find(bm => bm.id === id);

      queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) =>
        old.map((bm) =>
          bm.id === id
            ? {
                ...bm,
                ...(input.title !== undefined && { title: input.title }),
                ...(input.url !== undefined && { url: input.url }),
                ...(input.description !== undefined && {
                  description: input.description,
                }),
                ...(input.favicon !== undefined && { favicon: input.favicon }),
                ...(input.categoryId !== undefined && {
                  categoryId: input.categoryId,
                }),
                updatedAt: new Date(),
              }
            : bm
        )
      );

      return { previousItem };
    },
    onError: (err, _variables, context) => {
      if (context?.previousItem) {
        queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) =>
          old.map(bm => bm.id === context.previousItem!.id ? context.previousItem! : bm)
        );
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to update bookmark. Changes rolled back."
      );
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: ["updateBookmark"] }) <= 1) {
        queryClient.invalidateQueries({ queryKey });
        if (userId) {
          queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
        }
      }
    },
  });

  // ----------------------------------------------------
  // 4. MUTATION: Optimistic Delete Bookmark
  // ----------------------------------------------------
  const deleteMutation = useMutation({
    mutationKey: ["deleteBookmark"],
    mutationFn: async (id: string) => {
      return await deleteBookmarkAction(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });

      const previousBookmarks =
        queryClient.getQueryData<BookmarkItem[]>(queryKey) || [];
      const deletedItem = previousBookmarks.find(bm => bm.id === id);

      queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) =>
        old.filter((bm) => bm.id !== id)
      );

      return { deletedItem };
    },
    onError: (err, _id, context) => {
      if (context?.deletedItem) {
        queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) => {
          if (old.some(bm => bm.id === _id)) return old;
          return [...old, context.deletedItem!];
        });
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to delete bookmark. Restored state."
      );
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: ["deleteBookmark"] }) <= 1) {
        queryClient.invalidateQueries({ queryKey });
        if (userId) {
          queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
        }
      }
    },
  });

  // ----------------------------------------------------
  // 5. MUTATION: Optimistic Bulk Delete
  // ----------------------------------------------------
  const bulkDeleteMutation = useMutation({
    mutationKey: ["bulkDeleteBookmarks"],
    mutationFn: async (ids: string[]) => {
      return await bulkDeleteBookmarksAction(ids);
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey });
      const previousBookmarks = queryClient.getQueryData<BookmarkItem[]>(queryKey) || [];
      const deletedItems = previousBookmarks.filter(bm => ids.includes(bm.id));

      queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) =>
        old.filter((bm) => !ids.includes(bm.id))
      );
      return { deletedItems };
    },
    onError: (err, ids, context) => {
      if (context?.deletedItems) {
        queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) => {
          const currentIds = new Set(old.map(b => b.id));
          const itemsToRestore = context.deletedItems!.filter(bm => !currentIds.has(bm.id));
          return [...old, ...itemsToRestore];
        });
      }
      toast.error(err instanceof Error ? err.message : "Failed to bulk delete bookmarks.");
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: ["bulkDeleteBookmarks"] }) <= 1) {
        queryClient.invalidateQueries({ queryKey });
        if (userId) {
          queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
        }
      }
    },
  });

  // ----------------------------------------------------
  // 6. MUTATION: Optimistic Bulk Update
  // ----------------------------------------------------
  const bulkUpdateMutation = useMutation({
    mutationKey: ["bulkUpdateBookmarks"],
    mutationFn: async ({ ids, input }: { ids: string[]; input: { categoryId?: string | null; isPinned?: boolean } }) => {
      return await bulkUpdateBookmarksAction(ids, input);
    },
    onMutate: async ({ ids, input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousBookmarks = queryClient.getQueryData<BookmarkItem[]>(queryKey) || [];
      const previousItems = previousBookmarks.filter(bm => ids.includes(bm.id));

      queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) =>
        old.map((bm) =>
          ids.includes(bm.id)
            ? {
                ...bm,
                ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
                ...(input.isPinned !== undefined && { isPinned: input.isPinned }),
                updatedAt: new Date(),
              }
            : bm
        )
      );
      return { previousItems };
    },
    onError: (err, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) =>
          old.map(bm => {
            const prev = context.previousItems!.find(p => p.id === bm.id);
            return prev ? prev : bm;
          })
        );
      }
      toast.error(err instanceof Error ? err.message : "Failed to bulk update bookmarks.");
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: ["bulkUpdateBookmarks"] }) <= 1) {
        queryClient.invalidateQueries({ queryKey });
        if (userId) {
          queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
        }
      }
    },
  });

  // ----------------------------------------------------
  // 7. DEBOUNCED QUEUE DELETE LOGIC
  // ----------------------------------------------------
  const pendingDeletesRef = useRef<string[]>([]);
  const snapshotRef = useRef<Map<string, BookmarkItem>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedDeleteBookmark = useCallback((id: string) => {
    // 1. Cancel ongoing fetches
    queryClient.cancelQueries({ queryKey });

    // 2. Snapshot the item
    const currentBookmarks = queryClient.getQueryData<BookmarkItem[]>(queryKey) || [];
    const itemToDel = currentBookmarks.find(b => b.id === id);
    if (itemToDel) snapshotRef.current.set(id, itemToDel);

    // 3. Optimistically remove instantly (0ms latency)
    queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) => old.filter(b => b.id !== id));

    // 4. Queue the id
    if (!pendingDeletesRef.current.includes(id)) {
      pendingDeletesRef.current.push(id);
    }
    queryClient.setQueryData(["pendingDeletes"], pendingDeletesRef.current);

    // 5. Debounce the API call
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      const idsToProcess = [...pendingDeletesRef.current];
      pendingDeletesRef.current = [];
      queryClient.setQueryData(["pendingDeletes"], []);
      
      const validIds = idsToProcess.filter(id => !id.startsWith("temp-"));
      if (validIds.length === 0) {
        // If all were temp IDs, just clear snapshots and we're done
        idsToProcess.forEach(i => snapshotRef.current.delete(i));
        return;
      }

      try {
        if (validIds.length === 1) {
          await deleteBookmarkAction(validIds[0]);
        } else {
          await bulkDeleteBookmarksAction(validIds);
        }
        
        // Success: clear snapshots
        idsToProcess.forEach(i => snapshotRef.current.delete(i));
        
        // Invalidate if no other deletions are running
        if (queryClient.isMutating({ mutationKey: ["deleteBookmark"] }) === 0 && 
            queryClient.isMutating({ mutationKey: ["bulkDeleteBookmarks"] }) === 0) {
          queryClient.invalidateQueries({ queryKey });
          if (userId) queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
        }
      } catch (error) {
        console.error("Delete bookmark failed:", error);
        // Rollback
        queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) => {
          const restored = idsToProcess.map(i => snapshotRef.current.get(i)).filter(Boolean) as BookmarkItem[];
          const currentIds = new Set(old.map(b => b.id));
          const itemsToRestore = restored.filter(bm => !currentIds.has(bm.id));
          return [...old, ...itemsToRestore];
        });
        idsToProcess.forEach(i => snapshotRef.current.delete(i));
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to delete bookmarks: ${errorMessage}. Restored state.`);
      }
    }, 700);
  }, [queryClient, queryKey, userId]);

  return {
    bookmarks: query.data ?? EMPTY_BOOKMARKS,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    addBookmark: addMutation.mutate,
    addBookmarkAsync: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateBookmark: updateMutation.mutate,
    updateBookmarkAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteBookmark: debouncedDeleteBookmark,
    deleteBookmarkAsync: deleteMutation.mutateAsync, // Left for fallback/programmatic usage
    // eslint-disable-next-line react-hooks/refs
    isDeleting: deleteMutation.isPending || pendingDeletesRef.current.length > 0,
    addMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteBookmarks: bulkDeleteMutation.mutate,
    bulkDeleteBookmarksAsync: bulkDeleteMutation.mutateAsync,
    isBulkDeleting: bulkDeleteMutation.isPending,
    bulkUpdateBookmarks: bulkUpdateMutation.mutate,
    bulkUpdateBookmarksAsync: bulkUpdateMutation.mutateAsync,
    isBulkUpdating: bulkUpdateMutation.isPending,
    refetch: query.refetch,
  };
}
