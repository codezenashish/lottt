"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useBookmarkStore } from "@/store/useBookmarkStore";
import { useSearchStore } from "@/store/useSearchStore";
import { useCategoriesQuery } from "@/features/bookmarks/hooks/use-bookmark-queries";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";
import { useLongPress } from "@/hooks/use-long-press";
import { BookmarkCategory } from "@/features/bookmarks/components/bookmark-card";
import { CategoryActionSheet } from "@/features/bookmarks/dialogs/category-action-sheet";
import { ShareCategoryDialog } from "@/features/bookmarks/dialogs/share-category-dialog";
import { CategoryContextMenu } from "@/features/bookmarks/components/category-context-menu";
import { EditCategoryModal } from "@/features/bookmarks/dialogs/edit-category-modal";

function CategoryPill({
  cat,
  isSelected,
  count,
  onSelect,
  onLongPress,
}: {
  cat: BookmarkCategory;
  isSelected: boolean;
  count: number;
  onSelect: () => void;
  onLongPress: (e: React.SyntheticEvent) => void;
}) {
  const longPressHandlers = useLongPress({
    onLongPress,
    onClick: onSelect,
    threshold: 500,
  });

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      type="button"
      {...longPressHandlers}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 select-none ${
        isSelected
          ? "bg-primary/10 text-primary border border-primary/20 font-semibold shadow-2xs"
          : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 font-medium"
      }`}
    >
      <span>{cat.name}</span>
      {count > 0 && (
        <Badge
          variant={isSelected ? "subtle" : "outline"}
          className="px-1.5 py-0 h-4 text-[10px] font-mono leading-none rounded-md"
        >
          {count}
        </Badge>
      )}
    </motion.button>
  );
}

export function BookmarkHeader() {
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { data: queryCategories } = useCategoriesQuery();
  const {
    openAddModal,
    bookmarks,
    categories: storeCategories,
    selectedCategoryId,
    setSelectedCategory,
  } = useBookmarkStore();
  const { query, setQuery } = useSearchStore();

  // Context Menu & Dialog States
  const [contextMenuCategory, setContextMenuCategory] = useState<BookmarkCategory | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [contextMenuCount, setContextMenuCount] = useState<number>(0);

  const [editCategory, setEditCategory] = useState<BookmarkCategory | null>(null);
  const [actionSheetCategory, setActionSheetCategory] = useState<BookmarkCategory | null>(null);
  const [actionSheetCount, setActionSheetCount] = useState<number>(0);
  const [shareDialogCategory, setShareDialogCategory] = useState<BookmarkCategory | null>(null);

  useEffect(() => {
    const target = searchContainerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        window.dispatchEvent(
          new CustomEvent("search-bar-visibility", {
            detail: { isVisible: entry.isIntersecting },
          })
        );
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, []);

  const currentCategoryId =
    typeof selectedCategoryId === "string"
      ? selectedCategoryId
      : (selectedCategoryId as { id?: string } | null)?.id || null;

  const fetchedCategories = queryCategories || storeCategories;

  const realCategories = useMemo(() => {
    const dbCats = (fetchedCategories || []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color || "#6366F1",
      icon: cat.icon,
      isShared: Boolean(cat.isShared),
      shareToken: cat.shareToken || null,
    }));

    const extraCatsFromBookmarks: Array<{
      id: string;
      name: string;
      color: string;
      icon?: string;
      isShared?: boolean;
      shareToken?: string | null;
    }> = [];
    bookmarks.forEach((b) => {
      const catName =
        typeof b.category === "string" ? b.category : b.category?.name;
      const catId =
        b.categoryId ||
        (typeof b.category === "object" ? b.category?.id : null) ||
        catName;
      if (catName && !dbCats.some((c) => c.id === catId || c.name === catName)) {
        if (!extraCatsFromBookmarks.some((c) => c.name === catName)) {
          extraCatsFromBookmarks.push({
            id: catId || catName,
            name: catName,
            color: "#6366F1",
          });
        }
      }
    });

    return [...dbCats, ...extraCatsFromBookmarks];
  }, [fetchedCategories, bookmarks]);

  const handleCategorySelect = (catId: string | null, catName?: string) => {
    setSelectedCategory(catId);
    if (catId === null) {
      toast.info("Showing all categories");
    } else if (catName) {
      toast.info(`Filtered by category: ${catName}`);
    }
  };

  const handleLongPressCategory = (e: React.SyntheticEvent, cat: BookmarkCategory, count: number) => {
    let x = window.innerWidth / 2 - 100;
    let y = 200;

    if ("touches" in e && (e as React.TouchEvent).touches.length > 0) {
      const touch = (e as React.TouchEvent).touches[0];
      x = touch.clientX;
      y = touch.clientY;
    } else if ("clientX" in e) {
      const mouse = e as React.MouseEvent;
      x = mouse.clientX;
      y = mouse.clientY;
    } else if (e.currentTarget) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.bottom + 8;
    }

    setContextMenuPos({ x, y });
    setContextMenuCategory(cat);
    setContextMenuCount(count);
  };

  const handleCategoryDeleted = (deletedId: string) => {
    if (currentCategoryId === deletedId) {
      setSelectedCategory(null);
      toast.info("Active category deleted. Showing all bookmarks.");
    }
  };

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Search Bar */}
      <div ref={searchContainerRef} id="in-page-search-bar" className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bookmarks or tags..."
          className="w-full rounded-xl bg-card border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all shadow-2xs"
        />
      </div>

      {/* Category Pills List */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1 select-none">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => handleCategorySelect(null)}
          className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${
            currentCategoryId === null
              ? "bg-primary/10 text-primary border border-primary/20 font-semibold shadow-2xs"
              : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 font-medium"
          }`}
        >
          All
        </motion.button>

        {realCategories.map((cat) => {
          const isSelected = currentCategoryId === cat.id;
          const count = bookmarks.filter((b) => {
            const bCat =
              typeof b.category === "string" ? b.category : b.category?.name;
            return (
              bCat === cat.id || b.categoryId === cat.id || bCat === cat.name
            );
          }).length;

          return (
            <CategoryPill
              key={cat.id}
              cat={cat}
              isSelected={isSelected}
              count={count}
              onSelect={() => handleCategorySelect(isSelected ? null : cat.id, cat.name)}
              onLongPress={(e) => handleLongPressCategory(e, cat, count)}
            />
          );
        })}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => openAddModal(null)}
          className="flex items-center justify-center h-8 w-8 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shrink-0"
          title="Add Bookmark"
        >
          <Plus className="h-3.5 w-3.5" />
        </motion.button>
      </div>

      {/* Unified Context Menu for Category Tap & Hold / Right Click */}
      <CategoryContextMenu
        isOpen={Boolean(contextMenuCategory)}
        position={contextMenuPos}
        category={contextMenuCategory}
        onClose={() => setContextMenuCategory(null)}
        onShareClick={(cat) => setShareDialogCategory(cat)}
        onEditClick={(cat) => setEditCategory(cat)}
        onDeleteClick={(cat) => {
          setActionSheetCategory(cat);
          setActionSheetCount(contextMenuCount);
        }}
      />

      {/* Rename Category Modal */}
      {editCategory && (
        <EditCategoryModal
          isOpen={Boolean(editCategory)}
          onClose={() => setEditCategory(null)}
          category={editCategory}
        />
      )}

      {/* Contextual Category Action Sheet / Delete Confirmation */}
      {actionSheetCategory && (
        <CategoryActionSheet
          isOpen={Boolean(actionSheetCategory)}
          onClose={() => setActionSheetCategory(null)}
          category={actionSheetCategory}
          bookmarkCount={actionSheetCount}
          onOpenShare={(cat) => setShareDialogCategory(cat)}
          onCategoryDeleted={handleCategoryDeleted}
        />
      )}

      {/* Share Category Dialog */}
      {shareDialogCategory && (
        <ShareCategoryDialog
          isOpen={Boolean(shareDialogCategory)}
          onClose={() => setShareDialogCategory(null)}
          category={shareDialogCategory}
          onShareUpdate={(updatedCat) => {
            setShareDialogCategory(updatedCat);
          }}
        />
      )}
    </div>
  );
}
