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

  const handleShareClick = () => {
    onShareClick(category);
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
            className="fixed z-100 w-48 rounded-xl border border-border bg-card p-1 shadow-xl font-sans text-xs text-foreground select-none backdrop-blur-md"
            style={{
              top: position.y,
              left: position.x,
            }}
          >
            <div className="px-2.5 py-1.5 mb-1 border-b border-border">
              <p className="text-xs font-semibold text-foreground truncate">{category.name}</p>
            </div>

            <button
              type="button"
              onClick={handleShareClick}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share Category</span>
            </button>

            <button
              type="button"
              onClick={handleEdit}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Category Name</span>
            </button>

            <div className="h-px bg-border my-1 w-full" />

            <button
              type="button"
              onClick={handleDelete}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
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
