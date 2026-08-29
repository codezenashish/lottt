"use client";

import { useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useBookmarkStore } from "@/store/useBookmarkStore";
import { useSearchStore } from "@/store/useSearchStore";
import { useCategoriesQuery } from "@/features/bookmarks/hooks/use-bookmark-queries";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";

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
      color: cat.color || "#10b981",
      icon: cat.icon,
    }));

    const extraCatsFromBookmarks: Array<{
      id: string;
      name: string;
      color: string;
      icon?: string;
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
            color: "#10b981",
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

  return (
    <div className="flex flex-col gap-3 md:gap-4">
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
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => handleCategorySelect(isSelected ? null : cat.id, cat.name)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${
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
    </div>
  );
}
