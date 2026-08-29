"use client";

import { cn } from "@/lib/utils";
import { BookmarkItem, BookmarkCategory } from "./bookmark-card";
import BookmarkCard from "./bookmark-card";
import BookmarkRow from "./bookmark-row";

export interface CategoryWithBookmarks extends BookmarkCategory {
  bookmarks: BookmarkItem[];
}

interface BookmarkListProps {
  categories: CategoryWithBookmarks[];
  viewType: "grid" | "list";
  onDelete: (bookmark: BookmarkItem | string) => void;
  isDeleting?: boolean;
}

/** Renders category sections and selects the requested bookmark layout. */
export default function BookmarkList({
  categories,
  viewType,
  onDelete,
  isDeleting,
}: BookmarkListProps) {
  return (
    <div
      className={cn(viewType === "list" ? "flex flex-col gap-8" : "space-y-8")}
    >
      {categories.map((category) => {
        return (
          <section key={category.id}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground font-sans tracking-tight">
              <span>{category.name}</span>
              <span className="rounded-full bg-muted border border-border px-2 py-0.2 font-mono text-[11px] font-normal text-muted-foreground">
                {category.bookmarks.length}
              </span>
            </h2>
            {viewType === "grid" ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {category.bookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    onDelete={onDelete}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            ) : (
              <BookmarkRow
                bookmarks={category.bookmarks}
                onDelete={onDelete}
                isDeleting={isDeleting}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}
