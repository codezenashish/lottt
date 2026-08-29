"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Share2, Trash2, Globe, Users, Lock, AlertTriangle, Layers, Bookmark } from "lucide-react";
import { BookmarkCategory, BookmarkItem } from "../components/bookmark-card";
import { useDeleteCategoryMutation } from "../hooks/use-bookmark-queries";

interface CategoryActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  category: BookmarkCategory & { isShared?: boolean; shareToken?: string | null };
  bookmarkCount: number;
  onOpenShare: (category: BookmarkCategory) => void;
  onCategoryDeleted?: (categoryId: string) => void;
  userId?: string;
}

export function CategoryActionSheet({
  isOpen,
  onClose,
  category,
  bookmarkCount,
  onOpenShare,
  onCategoryDeleted,
  userId,
}: CategoryActionSheetProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteCategoryMutation = useDeleteCategoryMutation(userId);

  if (!isOpen) return null;

  const handleShareClick = () => {
    onClose();
    onOpenShare(category);
  };

  const handleDeleteOnlyCategory = async () => {
    try {
      await deleteCategoryMutation.mutateAsync({ categoryId: category.id, deleteBookmarks: false });
      if (onCategoryDeleted) onCategoryDeleted(category.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch {
      // Error handled by mutation hook
    }
  };

  const handleDeleteCategoryAndBookmarks = async () => {
    try {
      await deleteCategoryMutation.mutateAsync({ categoryId: category.id, deleteBookmarks: true });
      if (onCategoryDeleted) onCategoryDeleted(category.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch {
      // Error handled by mutation hook
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden text-foreground animate-in slide-in-from-bottom-6 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="min-w-0 pr-2">
            <h3 className="text-base font-bold text-foreground truncate">
              {category.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground font-mono">
                {bookmarkCount} {bookmarkCount === 1 ? "bookmark" : "bookmarks"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Actions */}
        <div className="p-6 space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border">
            <span className="text-xs font-semibold text-muted-foreground font-mono uppercase tracking-wider">Access Status</span>
            {category.isShared ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                <Globe className="w-3.5 h-3.5" />
                Public Link Enabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border text-xs font-medium">
                <Lock className="w-3.5 h-3.5" />
                Private Category
              </span>
            )}
          </div>

          {!showDeleteConfirm ? (
            <div className="space-y-2 pt-2">
              {/* Share Action */}
              <button
                type="button"
                onClick={handleShareClick}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-background hover:bg-muted border border-border transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-semibold text-foreground">Share & Collaborate</h4>
                    <p className="text-xs text-muted-foreground">Manage public link or invite friends with roles</p>
                  </div>
                </div>
              </button>

              {/* Delete Action */}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-background hover:bg-destructive/10 border border-border hover:border-destructive/30 transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-semibold text-destructive">Delete Category</h4>
                    <p className="text-xs text-muted-foreground">Remove or uncategorize bookmarks</p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            /* Confirm Delete View */
            <div className="space-y-4 pt-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  Delete Category: {category.name}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  How would you like to process bookmarks inside this category?
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleDeleteOnlyCategory}
                  disabled={deleteCategoryMutation.isPending}
                  className="w-full p-3.5 rounded-xl bg-background hover:bg-muted border border-border text-xs font-semibold text-foreground text-left transition cursor-pointer flex items-center justify-between"
                >
                  <span>1. Delete Category Only <span className="text-muted-foreground font-normal">(Keep bookmarks uncategorized)</span></span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteCategoryAndBookmarks}
                  disabled={deleteCategoryMutation.isPending}
                  className="w-full p-3.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-xs hover:bg-destructive/90 transition cursor-pointer text-left flex items-center justify-between"
                >
                  <span>2. Delete Category & All {bookmarkCount} Bookmarks</span>
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full p-3.5 rounded-xl bg-card border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer text-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
