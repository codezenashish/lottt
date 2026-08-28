"use client";

import React from "react";
import { Copy, Share2, Edit2, Trash2, ShieldOff } from "lucide-react";
import { BookmarkCategory } from "./bookmark-card";
import { toast } from "sonner";
import { createPortal } from "react-dom";

interface CategoryContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  category: BookmarkCategory | null;
  menuRef: React.RefObject<HTMLDivElement | null>;
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
  if (!isOpen || !category) return null;

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
      // The parent will need to refetch categories, but for now we just show a toast
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
    <div
      ref={menuRef as React.RefObject<HTMLDivElement>}
      className="fixed z-[100] w-48 rounded-xl border border-border bg-card shadow-xl py-1.5 px-1 animate-in fade-in zoom-in-95 duration-100"
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
        onClick={handleShareClick}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
      >
        <Share2 className="h-3.5 w-3.5" />
        {category.isShared ? "Manage Share" : "Share Category"}
      </button>

      {category.isShared && (
        <>
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy Share Link
          </button>
          <button
            onClick={handleRevokeShare}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          >
            <ShieldOff className="h-3.5 w-3.5" />
            Revoke Share
          </button>
        </>
      )}

      <div className="h-px bg-border my-1 w-full" />

      <button
        onClick={handleEdit}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
      >
        <Edit2 className="h-3.5 w-3.5" />
        Edit Category
      </button>

      <button
        onClick={handleDelete}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete Category
      </button>
    </div>
  );

  if (typeof window !== "undefined") {
    return createPortal(menu, document.body);
  }

  return null;
}
