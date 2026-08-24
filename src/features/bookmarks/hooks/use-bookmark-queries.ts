"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";
import {
  BookmarkItem,
  BookmarkCategory,
} from "../components/bookmark-card";
import { useBookmarks, getBookmarksQueryKey } from "@/hooks/use-bookmarks";
import { useBookmarksRealtime } from "@/hooks/use-bookmarks-realtime";
import {
  createBookmarkAction,
  updateBookmarkAction,
  deleteBookmarkAction,
} from "@/app/actions/bookmarks";
import { deleteCategoryAction } from "@/app/actions/category";

export { useBookmarks, useBookmarksRealtime, getBookmarksQueryKey };

export interface CategoryWithBookmarks extends BookmarkCategory {
  bookmarks: BookmarkItem[];
}

interface FetchCategoriesResponse {
  categories: BookmarkCategory[];
}

// ----------------------------------------------------
// Category Fetchers
// ----------------------------------------------------

async function fetchCategories(): Promise<BookmarkCategory[]> {
  const res = await fetch("/api/category");
  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }
  const data: FetchCategoriesResponse = await res.json();
  return data.categories || [];
}

async function createCategory(newCategory: {
  name: string;
  color?: string;
  icon?: string;
}): Promise<BookmarkCategory> {
  const res = await fetch("/api/category", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newCategory),
  });

  if (!res.ok) {
    throw new Error("Failed to create category");
  }

  const data = await res.json();
  return data.category;
}

// ----------------------------------------------------
// Unified Query & Mutation Hooks
// ----------------------------------------------------

export function useBookmarksQuery(userIdOrEnabled?: string | boolean) {
  const userId = typeof userIdOrEnabled === "string" ? userIdOrEnabled : undefined;
  const { bookmarks, isLoading, isError, error, refetch } = useBookmarks(userId);

  return {
    data: bookmarks,
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function useCategoriesQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    enabled,
  });
}

/**
 * Optimistic Create Bookmark Mutation (0ms perceived latency)
 */
export function useCreateBookmarkMutation(userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = getBookmarksQueryKey(userId);

  return useMutation({
    mutationFn: async (newBookmark: {
      title: string;
      url: string;
      description?: string;
      categoryId?: string;
      tags?: string[];
      favicon?: string;
    }) => {
      const result = await createBookmarkAction(newBookmark);
      return result as unknown as BookmarkItem;
    },
    onMutate: async (newBookmark) => {
      await queryClient.cancelQueries({ queryKey });

      const previousBookmarks =
        queryClient.getQueryData<BookmarkItem[]>(queryKey) || [];

      const optimisticItem: BookmarkItem = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: newBookmark.title,
        url: newBookmark.url,
        description: newBookmark.description || null,
        favicon:
          newBookmark.favicon ||
          `https://www.google.com/s2/favicons?domain=${
            newBookmark.url.replace(/^https?:\/\//i, "").split("/")[0]
          }&sz=128`,
        userId: userId || "user",
        categoryId: newBookmark.categoryId || null,
        category: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) => [
        optimisticItem,
        ...old,
      ]);

      return { previousBookmarks };
    },
    onError: (err, _newBookmark, context) => {
      if (context?.previousBookmarks) {
        queryClient.setQueryData(queryKey, context.previousBookmarks);
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to add bookmark. Rolled back state."
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      }
    },
  });
}

/**
 * Optimistic Update Bookmark Mutation
 */
export function useUpdateBookmarkMutation(userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = getBookmarksQueryKey(userId);

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        title?: string;
        url?: string;
        description?: string | null;
        categoryId?: string | null;
        tags?: string[];
        favicon?: string | null;
        isPinned?: boolean;
      };
    }) => {
      const result = await updateBookmarkAction(id, {
        title: data.title,
        url: data.url,
        description: data.description,
        favicon: data.favicon,
        categoryId: data.categoryId,
      });
      return result as unknown as BookmarkItem;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousBookmarks =
        queryClient.getQueryData<BookmarkItem[]>(queryKey) || [];

      queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) =>
        old.map((bm) =>
          bm.id === id
            ? {
                ...bm,
                ...(data.title !== undefined && { title: data.title }),
                ...(data.url !== undefined && { url: data.url }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.favicon !== undefined && { favicon: data.favicon }),
                ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
                ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
                updatedAt: new Date(),
              }
            : bm
        )
      );

      return { previousBookmarks };
    },
    onError: (err, _vars, context) => {
      if (context?.previousBookmarks) {
        queryClient.setQueryData(queryKey, context.previousBookmarks);
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to update bookmark."
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      }
    },
  });
}

/**
 * Optimistic Delete Bookmark Mutation
 */
export function useDeleteBookmarkMutation(userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = getBookmarksQueryKey(userId);

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteBookmarkAction(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });

      const previousBookmarks =
        queryClient.getQueryData<BookmarkItem[]>(queryKey) || [];

      queryClient.setQueryData<BookmarkItem[]>(queryKey, (old = []) =>
        old.filter((bm) => bm.id !== id)
      );

      return { previousBookmarks };
    },
    onError: (err, _id, context) => {
      if (context?.previousBookmarks) {
        queryClient.setQueryData(queryKey, context.previousBookmarks);
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to delete bookmark."
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      }
    },
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: (newCat) => {
      queryClient.setQueryData<BookmarkCategory[]>(["categories"], (old = []) => [
        ...old,
        newCat,
      ]);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategoryMutation(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      await deleteCategoryAction(categoryId);
      return categoryId;
    },
    onMutate: async (categoryId) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      
      const previousCategories = queryClient.getQueryData<BookmarkCategory[]>(["categories"]) || [];
      const deletedCategory = previousCategories.find(c => c.id === categoryId);

      queryClient.setQueryData<BookmarkCategory[]>(["categories"], (old = []) =>
        old.filter(c => c.id !== categoryId)
      );

      // Also optimistically remove all bookmarks that belong to this category
      const bookmarksKey = getBookmarksQueryKey(userId);
      await queryClient.cancelQueries({ queryKey: bookmarksKey });
      const previousBookmarks = queryClient.getQueryData<BookmarkItem[]>(bookmarksKey) || [];

      queryClient.setQueryData<BookmarkItem[]>(bookmarksKey, (old = []) =>
        old.filter(bm => bm.categoryId !== categoryId && bm.category?.id !== categoryId)
      );

      return { previousCategories, deletedCategory, previousBookmarks, bookmarksKey };
    },
    onError: (err, categoryId, context) => {
      if (context?.deletedCategory) {
        queryClient.setQueryData<BookmarkCategory[]>(["categories"], (old = []) => {
          if (old.some(c => c.id === categoryId)) return old;
          return [...old, context.deletedCategory!];
        });
      }
      if (context?.previousBookmarks && context?.bookmarksKey) {
        queryClient.setQueryData(context.bookmarksKey, context.previousBookmarks);
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete category.");
    },
    onSettled: (_data, _error, _variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      if (context?.bookmarksKey) {
        queryClient.invalidateQueries({ queryKey: context.bookmarksKey });
        queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      }
    }
  });
}
