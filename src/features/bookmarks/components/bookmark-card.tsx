"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { GlobalIcon } from "@hugeicons/core-free-icons";
import { Star, Check } from "lucide-react";
import { BookmarkContextMenu } from "./bookmark-context-menu";

export interface BookmarkTag {
  id: string;
  name: string;
}

export interface BookmarkCategory {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  isShared?: boolean;
  shareToken?: string | null;
  userId?: string;
  isCollaborator?: boolean;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  favicon?: string | null;
  userId?: string;
  categoryId?: string | null;
  category?: BookmarkCategory | null;
  tags?: BookmarkTag[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  isPinned?: boolean;
}

interface BookmarkCardProps {
  bookmark: BookmarkItem;
  onEdit?: (bookmark: BookmarkItem) => void;
  onInlineEdit?: (id: string, newTitle: string) => void;
  onDelete?: (bookmark: BookmarkItem | string) => void;
  onPin?: (id: string) => void;
  isDeleting?: boolean;
  layoutMode?: "grid" | "list";
  isSelected?: boolean;
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
  selectionMode?: boolean;
}

export function BookmarkCard({
  bookmark,
  onInlineEdit,
  onDelete,
  onPin,
  isDeleting = false,
  isSelected = false,
  onToggleSelect,
  selectionMode = false,
}: BookmarkCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inlineTitle, setInlineTitle] = useState(bookmark.title);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const getDomain = (url: string) => {
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  const domain = getDomain(bookmark.url);
  const faviconUrl =
    bookmark.favicon ||
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  const cancelPressTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPressTimer = useCallback(
    (clientX: number, clientY: number, e: React.SyntheticEvent) => {
      cancelPressTimer();
      isLongPressRef.current = false;
      startPosRef.current = { x: clientX, y: clientY };

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        if (onToggleSelect) {
          onToggleSelect(bookmark.id, e as unknown as React.MouseEvent);
          toast.info("Selection Mode active", { duration: 1500 });
        }
      }, 500);
    },
    [bookmark.id, onToggleSelect, cancelPressTimer]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      startPressTimer(touch.clientX, touch.clientY, e);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch && startPosRef.current) {
      const dx = Math.abs(touch.clientX - startPosRef.current.x);
      const dy = Math.abs(touch.clientY - startPosRef.current.y);
      if (dx > 8 || dy > 8) {
        cancelPressTimer();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    startPressTimer(e.clientX, e.clientY, e);
  };

  const handleMouseUp = () => {
    cancelPressTimer();
  };

  const handleMouseLeave = () => {
    cancelPressTimer();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressRef.current = false;
      return;
    }

    if (selectionMode || isSelected) {
      e.preventDefault();
      e.stopPropagation();
      if (onToggleSelect) {
        onToggleSelect(bookmark.id, e);
      }
      return;
    }

    if (!isEditing && bookmark.url) {
      window.open(bookmark.url, "_blank");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (onInlineEdit && inlineTitle.trim() !== bookmark.title) {
        onInlineEdit(bookmark.id, inlineTitle.trim());
        toast.success("Title updated");
      }
      setIsEditing(false);
    } else if (e.key === "Escape") {
      setInlineTitle(bookmark.title);
      setIsEditing(false);
    }
  };

  const displayTitle = bookmark.title && bookmark.title.trim() !== ""
    ? bookmark.title
    : domain || bookmark.url;

  return (
    <BookmarkContextMenu
      bookmark={bookmark}
      onEditInline={() => setIsEditing(true)}
      onDelete={() => onDelete && onDelete(bookmark)}
    >
      <motion.article
        whileTap={{ scale: 0.98 }}
        whileHover={{ y: -1 }}
        transition={{ duration: 0.15 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={cancelPressTimer}
        onTouchCancel={cancelPressTimer}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onContextMenu={(e) => {
          if (isLongPressRef.current) {
            e.preventDefault();
          }
        }}
        className={`group relative flex min-w-0 items-center gap-3 rounded-xl border p-3 shadow-2xs transition-all duration-200 cursor-pointer select-none ${
          isSelected
            ? "border-primary bg-primary/10 ring-1 ring-primary/30 shadow-xs"
            : "border-border bg-card hover:border-foreground/20 hover:bg-muted/50"
        }`}
      >
        {/* Selection Indicator Checkbox */}
        {(selectionMode || isSelected) && (
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-card"
            }`}
          >
            {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
          </div>
        )}

        {/* Website Favicon */}
        <div className="relative shrink-0">
          {faviconUrl && !imgError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={faviconUrl}
              alt=""
              className="h-6 w-6 rounded-lg object-cover ring-1 ring-border/40 transition-transform group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted ring-1 ring-border/40">
              <HugeiconsIcon icon={GlobalIcon} size={14} className="text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Title & Domain info */}
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <input
              autoFocus
              value={inlineTitle}
              onChange={(e) => setInlineTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (onInlineEdit && inlineTitle.trim() !== bookmark.title) {
                  onInlineEdit(bookmark.id, inlineTitle.trim());
                  toast.success("Title updated");
                }
                setIsEditing(false);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="block w-full text-sm text-foreground bg-transparent border-b border-foreground/30 focus:border-foreground focus:outline-none transition-colors px-0 py-0.5"
            />
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="truncate text-sm text-foreground font-sans tracking-tight">
                {displayTitle}
              </span>
              {bookmark.isPinned && (
                <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
              )}
            </div>
          )}
          <span className="block truncate text-xs text-muted-foreground font-mono mt-0.5">
            {domain}
          </span>
        </div>
      </motion.article>
    </BookmarkContextMenu>
  );
}

export default BookmarkCard;