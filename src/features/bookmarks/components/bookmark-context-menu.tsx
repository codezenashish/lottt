"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ExternalLink, Share, Edit2, Trash2 } from "lucide-react";
import { BookmarkItem } from "./bookmark-card";
import { toast } from "sonner";

interface BookmarkContextMenuProps {
  children: React.ReactNode;
  bookmark: BookmarkItem;
  onEditInline: () => void;
  onDelete: () => void;
}

export function BookmarkContextMenu({
  children,
  bookmark,
  onEditInline,
  onDelete,
}: BookmarkContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 176;
    const menuHeight = 210;
    let x = e.clientX;
    let y = e.clientY;

    if (window.innerWidth - x < menuWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (window.innerHeight - y < menuHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    setPosition({ x, y });
    setIsOpen(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmark.url);
    toast.success("Bookmark URL copied to clipboard");
    setIsOpen(false);
  };

  const handleOpen = () => {
    window.open(bookmark.url, "_blank");
    setIsOpen(false);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: bookmark.title,
          url: bookmark.url,
        });
      } else {
        handleCopy();
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
    setIsOpen(false);
  };

  const handleRename = () => {
    onEditInline();
    setIsOpen(false);
  };

  const handleDelete = () => {
    onDelete();
    setIsOpen(false);
  };

  return (
    <div onContextMenu={handleContextMenu} className="relative w-full h-full">
      {children}

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-90 cursor-default"
              onClick={() => setIsOpen(false)}
              onContextMenu={(e) => {
                e.preventDefault();
                setIsOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="fixed z-100 w-44 rounded-xl border border-border bg-card p-1 shadow-xl text-foreground font-sans text-xs select-none"
              style={{
                top: position.y,
                left: position.x,
              }}
            >
              <button
                type="button"
                onClick={handleOpen}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in new tab</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy URL</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Share className="h-3.5 w-3.5" />
                <span>Share</span>
              </button>

              <div className="h-px bg-border my-1 w-full" />

              <button
                type="button"
                onClick={handleRename}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Rename</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
