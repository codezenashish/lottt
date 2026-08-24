"use client";

import { useState } from "react";
import {
  FileText,
  Tag as TagIcon,
  Calendar,
  Edit2,
  Trash2,
  Copy,
  Check,
  Pin,
  Star,
  ExternalLink,
  Globe,
} from "lucide-react";
import { clsx } from "clsx";

export interface Note {
  id: string;
  title: string;
  content: string;
  language?: string | null;
  isSnippet?: boolean;
  tags?: string[];
  isPinned?: boolean;
  isBookmarked?: boolean;
  folderId?: string | null;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  selectedText?: string | null;
  sourceAnchor?: string | null;
  referenceId?: string | null;
  userId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export function getReferenceUrl(note: Note): string {
  if (!note.sourceUrl) return "";
  let anchor: { text?: string; prefix?: string; suffix?: string; selector?: string; startOffset?: number; endOffset?: number } = {};
  if (note.sourceAnchor) {
    try {
      anchor = typeof note.sourceAnchor === "string" ? JSON.parse(note.sourceAnchor) : note.sourceAnchor;
    } catch {
      // Ignore JSON parse errors
    }
  }
  const textToUse = note.selectedText || anchor.text || note.content || "";
  const prefix = anchor.prefix || "";
  const suffix = anchor.suffix || "";

  let textFragment = "";
  if (textToUse) {
    const p = prefix ? `${encodeURIComponent(prefix.trim().slice(-40))}-,` : "";
    const s = suffix ? `,-${encodeURIComponent(suffix.trim().slice(0, 40))}` : "";
    const t = encodeURIComponent(textToUse.trim());
    textFragment = `:~:text=${p}${t}${s}`;
  }

  const refPayload = {
    referenceId: note.referenceId || "",
    selectedText: textToUse,
    prefix: prefix,
    suffix: suffix,
    selector: anchor.selector || "",
    startOffset: anchor.startOffset,
    endOffset: anchor.endOffset,
  };
  const refFragment = `ryuk-ref=${encodeURIComponent(JSON.stringify(refPayload))}`;

  const [baseUrl] = note.sourceUrl.split("#");
  return `${baseUrl}#${refFragment}&${textFragment}`;
}

interface NotesCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTagClick?: (tag: string) => void;
  onTogglePin?: (id: string, isPinned: boolean) => void;
  onToggleBookmark?: (id: string, isBookmarked: boolean) => void;
  layoutMode?: "grid" | "list";
}

export function NotesCard({
  note,
  onEdit,
  onDelete,
  onTagClick,
  onTogglePin,
  onToggleBookmark,
  layoutMode = "grid",
}: NotesCardProps) {
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(
    note.updatedAt || note.createdAt
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const getTextPreview = (html: string) => {
    if (typeof window === "undefined") return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const textPreview = getTextPreview(note.content);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(textPreview || note.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (layoutMode === "list") {
    return (
      <div
        onClick={() => onEdit(note)}
        className={clsx(
          "group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-3 shadow-xs hover:border-foreground/20 hover:bg-muted transition-all duration-200 cursor-pointer",
          note.isPinned && "border-primary/30 bg-primary/5"
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-card text-muted-foreground group-hover:text-foreground shrink-0 transition-colors">
            {note.isPinned ? (
              <Pin className="w-4 h-4 text-primary fill-primary/20" />
            ) : (
              <FileText className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium text-foreground font-sans truncate group-hover:text-white transition-colors flex items-center gap-1.5">
              {note.title || "Untitled Note"}
              {note.isBookmarked && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
            </h4>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground font-sans truncate">
                {textPreview || "Empty content..."}
              </p>
              {note.sourceUrl && (
                <a
                  href={getReferenceUrl(note)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors shrink-0"
                  title={note.sourceTitle || note.sourceUrl}
                >
                  <span>Source → Open selection</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {note.tags && note.tags.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              {note.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-card text-muted-foreground border border-border font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <span className="text-[11px] text-muted-foreground font-mono">
            {formattedDate}
          </span>
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark?.(note.id, !note.isBookmarked);
              }}
              className={clsx("p-1 transition-colors cursor-pointer", note.isBookmarked ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500")}
              title={note.isBookmarked ? "Remove Bookmark" : "Bookmark"}
            >
              <Star className={clsx("w-3.5 h-3.5", note.isBookmarked && "fill-current")} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin?.(note.id, !note.isPinned);
              }}
              className={clsx("p-1 transition-colors cursor-pointer", note.isPinned ? "text-primary" : "text-muted-foreground hover:text-primary")}
              title={note.isPinned ? "Unpin Note" : "Pin Note"}
            >
              <Pin className={clsx("w-3.5 h-3.5", note.isPinned && "fill-current")} />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Copy Content"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="p-1 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
              title="Delete Note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onEdit(note)}
      className={clsx(
        "group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-xs transition-all duration-200 hover:border-foreground/20 hover:bg-muted hover:shadow-md cursor-pointer overflow-hidden min-h-[160px]",
        note.isPinned && "border-primary/30 bg-primary/5"
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 overflow-hidden">
            {note.sourceUrl ? (
              <a
                href={getReferenceUrl(note)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                title={note.sourceTitle || note.sourceUrl}
              >
                <Globe className="w-3 h-3 text-primary shrink-0" />
                <span>Source → Open selection</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-card text-muted-foreground border border-border">
                {note.isPinned ? (
                  <>
                    <Pin className="w-3 h-3 text-primary fill-primary/20" />
                    Pinned
                  </>
                ) : (
                  <>
                    <FileText className="w-3 h-3" />
                    Note
                  </>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark?.(note.id, !note.isBookmarked);
              }}
              className={clsx("p-1 transition-colors cursor-pointer", note.isBookmarked ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500")}
              title={note.isBookmarked ? "Remove Bookmark" : "Bookmark"}
            >
              <Star className={clsx("w-3.5 h-3.5", note.isBookmarked && "fill-current")} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin?.(note.id, !note.isPinned);
              }}
              className={clsx("p-1 transition-colors cursor-pointer", note.isPinned ? "text-primary" : "text-muted-foreground hover:text-primary")}
              title={note.isPinned ? "Unpin Note" : "Pin Note"}
            >
              <Pin className={clsx("w-3.5 h-3.5", note.isPinned && "fill-current")} />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Copy Content"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(note);
              }}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Edit Note"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="p-1 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
              title="Delete Note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-foreground font-sans tracking-tight line-clamp-1 mb-1.5 group-hover:text-white transition-colors">
          {note.title || "Untitled Note"}
        </h3>

        <p className="text-xs text-muted-foreground font-sans leading-relaxed line-clamp-3 mb-3">
          {textPreview || "No additional text..."}
        </p>
      </div>

      <div className="pt-2.5 border-t border-border flex items-center justify-between gap-2 mt-auto">
        <div className="flex flex-wrap items-center gap-1 overflow-hidden">
          {note.tags && note.tags.length > 0 ? (
            note.tags.slice(0, 2).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-card text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer font-mono"
              >
                <TagIcon className="w-2.5 h-2.5 text-muted-foreground" />
                {tag}
              </button>
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground italic">No tags</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono shrink-0">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
