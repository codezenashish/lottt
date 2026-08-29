export interface NoteItem {
  id: string;
  title: string;
  content: string;
  language?: string | null;
  isSnippet?: boolean;
  isBookmarked?: boolean;
  isPinned?: boolean;
  isShared?: boolean;
  shareToken?: string | null;
  folderId?: string | null;
  tags?: string[];
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  selectedText?: string | null;
  sourceAnchor?: string | null;
  referenceId?: string | null;
  userId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
