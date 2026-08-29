"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Share2, Edit2, Trash2, ShieldOff } from "lucide-react";
import { BookmarkCategory } from "./bookmark-card";
import { toast } from "sonner";
import { createPortal } from "react-dom";

interface CategoryContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  category: BookmarkCategory | null;
  menuRef?: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onShareClick: (category: BookmarkCategory) => void;
  onEditClick?: (category: BookmarkCategory) => void;
  onDeleteClick?: (category: BookmarkCategory) => void;
}

export function CategoryContextMenu({
  isOpen,
  position,
  category,
  menuRef,
  onClose,
  onShareClick,
  onEditClick,
  onDeleteClick,
}: CategoryContextMenuProps) {
  if (!category) return null;

  const shareUrl = category.shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/shared/c/${category.shareToken}`
    : "";

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard");
    } else {
      toast.error("Category is not shared yet");
    }
    onClose();
  };

  const handleShareClick = () => {
    onShareClick(category);
    onClose();
  };

  const handleRevokeShare = async () => {
    try {
      const res = await fetch(`/api/category/${category.id}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShared: false }),
      });
      if (!res.ok) throw new Error("Failed to revoke share");
      toast.success("Public access revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
    onClose();
  };

  const handleEdit = () => {
    if (onEditClick) onEditClick(category);
    onClose();
  };

  const handleDelete = () => {
    if (onDeleteClick) onDeleteClick(category);
    onClose();
  };

  const menu = (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-90 cursor-default"
            onClick={onClose}
            onContextMenu={(e) => {
              e.preventDefault();
              onClose();
            }}
          />
          <motion.div
            ref={menuRef as React.RefObject<HTMLDivElement>}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="fixed z-100 w-48 rounded-xl border border-border bg-card shadow-xl py-1.5 px-1 font-sans text-xs text-foreground select-none"
            style={{
              top: position.y,
              left: position.x,
            }}
          >
            <div className="px-2.5 py-2 mb-1 border-b border-border">
              <p className="text-xs font-semibold text-foreground truncate">{category.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {category.isShared ? "Publicly Shared" : "Private"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleShareClick}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{category.isShared ? "Manage Share" : "Share Category"}</span>
            </button>

            {category.isShared && (
              <>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Share Link</span>
                </button>
                <button
                  type="button"
                  onClick={handleRevokeShare}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                >
                  <ShieldOff className="h-3.5 w-3.5" />
                  <span>Revoke Share</span>
                </button>
              </>
            )}

            <div className="h-px bg-border my-1 w-full" />

            <button
              type="button"
              onClick={handleEdit}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Category</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Category</span>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof window !== "undefined") {
    return createPortal(menu, document.body);
  }

  return null;
}
