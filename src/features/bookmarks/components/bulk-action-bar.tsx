"use client";

import React, { useState } from "react";
import { X, Trash2, FolderInput } from "lucide-react";
import { BookmarkCategory } from "./bookmark-card";

interface BulkActionBarProps {
  selectedCount: number;
  categories: BookmarkCategory[];
  onClear: () => void;
  onDelete: () => void;
  onMoveToCategory: (categoryId: string | null) => void;
}

export function BulkActionBar({
  selectedCount,
  categories,
  onClear,
  onDelete,
  onMoveToCategory,
}: BulkActionBarProps) {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="flex items-center gap-2 rounded-full border border-foreground/20 bg-card shadow-xl p-1.5 px-3">
        <div className="flex items-center gap-2 px-2 border-r border-border">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {selectedCount}
          </span>
          <span className="text-sm font-medium text-foreground pr-2">selected</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <FolderInput className="h-4 w-4" />
            Move to...
          </button>

          {showCategoryMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowCategoryMenu(false)} 
              />
              <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border border-border bg-card p-1 shadow-lg z-50">
                <button
                  onClick={() => {
                    onMoveToCategory(null);
                    setShowCategoryMenu(false);
                  }}
                  className="w-full text-left rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  (No category)
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onMoveToCategory(cat.id);
                      setShowCategoryMenu(false);
                    }}
                    className="w-full text-left rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted truncate"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={onDelete}
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          onClick={onClear}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
