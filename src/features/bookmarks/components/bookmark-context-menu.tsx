"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      // Close on scroll too
      document.addEventListener("scroll", () => setIsOpen(false), true);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("scroll", () => setIsOpen(false), true);
    };
  }, [isOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Adjust position to prevent menu from going off-screen
    const menuWidth = 160;
    const menuHeight = 200; // approximate
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
    toast.success("URL copied to clipboard");
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

      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-[100] w-40 rounded-xl border border-border bg-card shadow-lg py-1.5 px-1 animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: position.y,
            left: position.x,
          }}
        >
          <button
            onClick={handleOpen}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in new tab
          </button>
          
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy URL
          </button>

          <button
            onClick={handleShare}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          >
            <Share className="h-3.5 w-3.5" />
            Share
          </button>

          <div className="h-px bg-border my-1 w-full" />

          <button
            onClick={handleRename}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Rename
          </button>

          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
