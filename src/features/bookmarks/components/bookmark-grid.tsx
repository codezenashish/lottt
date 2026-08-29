"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookmarkCard, BookmarkItem } from "./bookmark-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, Plus } from "lucide-react";

interface BookmarkGridProps {
  bookmarks: BookmarkItem[];
  isLoading?: boolean;
  layoutMode?: "grid" | "list";
  onEdit?: (bookmark: BookmarkItem) => void;
  onInlineEdit?: (id: string, newTitle: string) => void;
  onDelete?: (bookmark: BookmarkItem | string) => void;
  onPin?: (id: string) => void;
  onAddClick?: () => void;
  selectedBookmarkIds?: string[];
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function BookmarkGrid({
  bookmarks,
  isLoading = false,
  layoutMode = "grid",
  onEdit,
  onInlineEdit,
  onDelete,
  onPin,
  onAddClick,
  selectedBookmarkIds = [],
  onToggleSelect,
  emptyTitle = "No bookmarks found",
  emptyDescription = "Save your important links and resources here to access them anytime.",
}: BookmarkGridProps) {
  // Skeleton Loading Grid
  if (isLoading) {
    return (
      <div
        className={
          layoutMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "flex flex-col gap-3"
        }
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 h-44"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl bg-card" />
                  <Skeleton className="h-3 w-20 rounded-md bg-card" />
                </div>
                <Skeleton className="h-6 w-6 rounded-lg bg-card" />
              </div>
              <Skeleton className="h-4 w-3/4 rounded-md bg-card" />
              <Skeleton className="h-3.5 w-full rounded-md bg-card" />
            </div>
            <div className="flex gap-2 pt-3 border-t border-border">
              <Skeleton className="h-3 w-12 rounded-md bg-card" />
              <Skeleton className="h-3 w-12 rounded-md bg-card" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty State
  if (!bookmarks || bookmarks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 px-6 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card border border-border mb-4 shadow-inner">
          <Bookmark className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="font-sans text-lg font-semibold text-foreground mb-1">
          {emptyTitle}
        </h3>
        <p className="max-w-md text-xs text-muted-foreground mb-6 leading-relaxed">
          {emptyDescription}
        </p>

        {onAddClick && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onAddClick}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/80 transition shadow-sm active:translate-y-px cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add your first bookmark</span>
          </motion.button>
        )}
      </motion.div>
    );
  }

  // Bookmarks Render
  return (
    <div
      className={
        layoutMode === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "flex flex-col gap-3"
      }
    >
      <AnimatePresence mode="popLayout">
        {bookmarks.map((bookmark) => (
          <motion.div
            key={bookmark.id}
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <BookmarkCard
              bookmark={bookmark}
              layoutMode={layoutMode}
              isSelected={selectedBookmarkIds.includes(bookmark.id)}
              onToggleSelect={onToggleSelect}
              selectionMode={selectedBookmarkIds.length > 0}
              onEdit={onEdit}
              onInlineEdit={onInlineEdit}
              onDelete={onDelete}
              onPin={onPin}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default BookmarkGrid;
