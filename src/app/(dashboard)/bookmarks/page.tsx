"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { useBookmarkStore } from "@/store/useBookmarkStore";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useBookmarksRealtime } from "@/hooks/use-bookmarks-realtime";
import { useCategoriesQuery } from "@/features/bookmarks/hooks/use-bookmark-queries";
import { BookmarkHeader } from "@/features/bookmarks/components/bookmark-header";
import { BookmarkGrid } from "@/features/bookmarks/components/bookmark-grid";
import { AddBookmarkModal } from "@/features/bookmarks/dialogs/add-bookmark-modal";
import { ImportBookmarksModal } from "@/features/bookmarks/dialogs/import-bookmarks-modal";
import { BookmarkItem, BookmarkCategory } from "@/features/bookmarks/components/bookmark-card";
import { ShareCategoryDialog } from "@/features/bookmarks/dialogs/share-category-dialog";
import { BulkActionBar } from "@/features/bookmarks/components/bulk-action-bar";
import { useSearchStore } from "@/store/useSearchStore";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookmarksPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetCategory, setShareTargetCategory] = useState<BookmarkCategory | null>(null);

  // 1. Activate Realtime Subscription for instantaneous PC ↔ Mobile sync
  useBookmarksRealtime(userId);

  // 2. Fetch & Mutate Bookmarks with 0ms perceived latency (Optimistic UI)
  const {
    bookmarks,
    isLoading: isLoadingBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    bulkDeleteBookmarks,
    bulkUpdateBookmarks,
  } = useBookmarks(userId);

  const { data: queryCategories } = useCategoriesQuery();

  const {
    categories: storeCategories,
    selectedCategoryId,
    layoutMode,
    isAddModalOpen,
    editingBookmark,
    isImportModalOpen,
    selectedTags,
    dateRange,
    filterStatus,
    selectedBookmarkIds,
    toggleSelection,
    clearSelection,
    openAddModal,
    closeAddModal,
    closeImportModal,
  } = useBookmarkStore();

  const { query } = useSearchStore();
  const debouncedSearch = useDebounce(query, 300);
  const fetchedCategories = queryCategories || storeCategories;

  // Only show categories that have at least one bookmark
  const categories = useMemo(() => {
    return fetchedCategories.filter((cat) => 
      bookmarks.some((b) => b.category?.id === cat.id || b.categoryId === cat.id)
    );
  }, [fetchedCategories, bookmarks]);

  // Filter Bookmarks by search query and category
  const filteredBookmarks = useMemo(() => {
    const filtered = bookmarks.filter((b) => {
      const matchesCategory = selectedCategoryId
        ? b.category?.id === selectedCategoryId
        : true;
      
      const queryLower = debouncedSearch.toLowerCase();
      const matchesSearch = queryLower
        ? b.title.toLowerCase().includes(queryLower) ||
          b.url.toLowerCase().includes(queryLower) ||
          b.description?.toLowerCase().includes(queryLower)
        : true;

      const matchesStatus = filterStatus === "pinned" ? b.isPinned : true;

      const matchesTags = selectedTags.length > 0 
        ? selectedTags.some(tag => b.tags?.map(t => t.name).includes(tag))
        : true;

      let matchesDate = true;
      if (dateRange !== "all" && b.createdAt) {
        const createdDate = new Date(b.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - createdDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        
        if (dateRange === "today") {
          matchesDate = diffDays <= 1;
        } else if (dateRange === "week") {
          matchesDate = diffDays <= 7;
        } else if (dateRange === "month") {
          matchesDate = diffDays <= 30;
        }
      }

      return matchesCategory && matchesSearch && matchesStatus && matchesTags && matchesDate;
    });

    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [bookmarks, selectedCategoryId, debouncedSearch, selectedTags, dateRange, filterStatus]);

  const handleSaveBookmark = (data: {
    title: string;
    url: string;
    description?: string;
    categoryId?: string;
    categoryName?: string;
    tags: string[];
    favicon?: string;
  }) => {
    if (editingBookmark) {
      updateBookmark({
        id: editingBookmark.id,
        input: {
          title: data.title,
          url: data.url,
          description: data.description,
          categoryId: data.categoryId,
          favicon: data.favicon,
        },
      });
    } else {
      addBookmark({
        title: data.title,
        url: data.url,
        description: data.description,
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        favicon: data.favicon,
      });
    }
    closeAddModal();
  };

  const handlePinBookmark = (id: string) => {
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) {
      updateBookmark({ id, input: { isPinned: !bookmark.isPinned } });
    }
  };

  const handleInlineEdit = (id: string, newTitle: string) => {
    updateBookmark({ id, input: { title: newTitle } });
  };

  const handleDeleteBookmark = (target: string | BookmarkItem) => {
    const id = typeof target === "string" ? target : target.id;
    deleteBookmark(id);
  };

  const handleBulkDelete = () => {
    bulkDeleteBookmarks(selectedBookmarkIds);
    clearSelection();
  };

  const handleBulkMove = (categoryId: string | null) => {
    bulkUpdateBookmarks({ ids: selectedBookmarkIds, input: { categoryId } });
    clearSelection();
  };

  const selectedCategoryObj = useMemo(() => {
    return categories.find(c => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  if (isLoadingBookmarks && bookmarks.length === 0) {
    return (
      <div className="pt-4 md:pt-6 pb-6 flex flex-col gap-4 md:gap-5">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48 bg-muted rounded-lg" />
          <Skeleton className="h-9 w-32 bg-muted rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          <Skeleton className="h-40 w-full bg-muted rounded-xl" />
          <Skeleton className="h-40 w-full bg-muted rounded-xl" />
          <Skeleton className="h-40 w-full bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 md:pt-6 pb-6 flex flex-col gap-4 md:gap-5">
      {/* Modal */}
      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSave={handleSaveBookmark}
        categories={categories}
        initialData={editingBookmark}
      />
      <ImportBookmarksModal
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
        onSuccess={() => {
          closeImportModal();
          // Allow realtime to sync or just reload to be safe
          window.location.reload();
        }}
      />
      {(shareTargetCategory || selectedCategoryObj) && (
        <ShareCategoryDialog
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareTargetCategory(null);
          }}
          category={(shareTargetCategory || selectedCategoryObj)!}
          onShareUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
          }}
        />
      )}

      <BookmarkHeader />

      {/* Bookmark Grid / List */}
      <BookmarkGrid
        bookmarks={filteredBookmarks}
        layoutMode={layoutMode}
        selectedBookmarkIds={selectedBookmarkIds}
        onToggleSelect={toggleSelection}
        onEdit={(bm) => openAddModal(bm)}
        onInlineEdit={handleInlineEdit}
        onDelete={handleDeleteBookmark}
        onPin={handlePinBookmark}
        onAddClick={() => openAddModal(null)}
      />

      <BulkActionBar
        selectedCount={selectedBookmarkIds.length}
        categories={categories}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        onMoveToCategory={handleBulkMove}
      />
    </div>
  );
}
