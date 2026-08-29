"use client";

import { BookmarkCategory, BookmarkItem } from "./bookmark-card";
import { Users } from "lucide-react";
import { useCategoryContextMenu } from "../hooks/use-category-context-menu";
import { CategoryContextMenu } from "./category-context-menu";

interface CategoryFilterProps {
  categories: BookmarkCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  bookmarks?: BookmarkItem[];
  className?: string;
  onShareClick?: (category: BookmarkCategory) => void;
  onEditClick?: (category: BookmarkCategory) => void;
  onDeleteClick?: (category: BookmarkCategory) => void;
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
  bookmarks = [],
  className = "",
  onShareClick,
  onEditClick,
  onDeleteClick,
}: CategoryFilterProps) {
  // Calculate count for each category
  const getCategoryCount = (catId: string) => {
    return bookmarks.filter((b) => b.category?.id === catId).length;
  };

  const totalCount = bookmarks.length;
  
  const { isOpen, position, activeCategory, menuRef, openMenu, closeMenu } = useCategoryContextMenu();

  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none ${className}`}>
      {/* "All" Filter Pill */}
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition cursor-pointer shrink-0 ${
          selectedCategoryId === null
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
        }`}
      >
        <span>All Bookmarks</span>
        <span
          className={`ml-0.5 rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
            selectedCategoryId === null
              ? "bg-background/20 text-primary-foreground"
              : "bg-card text-muted-foreground"
          }`}
        >
          {totalCount}
        </span>
      </button>

      {/* Category Pills */}
      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        const count = getCategoryCount(cat.id);

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            onContextMenu={(e) => openMenu(e, cat)}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition cursor-pointer shrink-0 ${
              isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
            }`}
          >
            <span>{cat.name}</span>
            {cat.isCollaborator && (
              <Users className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />
            )}
            {count > 0 && (
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                  isSelected
                    ? "bg-background/20 text-primary-foreground"
                    : "bg-card text-muted-foreground"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}

      <CategoryContextMenu
        isOpen={isOpen}
        position={position}
        category={activeCategory}
        menuRef={menuRef}
        onClose={closeMenu}
        onShareClick={onShareClick || (() => {})}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
      />
    </div>
  );
}

export default CategoryFilter;
