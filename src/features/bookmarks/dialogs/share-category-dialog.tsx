"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Share2, Copy, Check, Globe, Link as LinkIcon, Loader2, Users, UserPlus, Trash2 } from "lucide-react";
import { BookmarkCategory } from "../components/bookmark-card";
import { useCollaboratorsQuery, useInviteCollaboratorMutation, useRemoveCollaboratorMutation, useUpdateCollaboratorRoleMutation } from "../hooks/use-category-collaborators";

interface ShareCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: BookmarkCategory;
  onShareUpdate: (updatedCategory: BookmarkCategory) => void;
}

export function ShareCategoryDialog({
  isOpen,
  onClose,
  category,
  onShareUpdate,
}: ShareCategoryDialogProps) {
  const [isShared, setIsShared] = useState(Boolean(category.isShared));
  const [localCategory, setLocalCategory] = useState<BookmarkCategory>(category);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"VIEWER" | "EDITOR">("VIEWER");

  const { data: collaborators, isLoading: isLoadingCollaborators } = useCollaboratorsQuery(category.id, isOpen);
  const inviteMutation = useInviteCollaboratorMutation(category.id);
  const removeMutation = useRemoveCollaboratorMutation(category.id);
  const updateRoleMutation = useUpdateCollaboratorRoleMutation(category.id);

  if (!isOpen) return null;

  const shareUrl = localCategory.shareToken
    ? `${window.location.origin}/shared/c/${localCategory.shareToken}`
    : "";

  const handleToggleShare = async () => {
    const previousSharedState = isShared;
    const newSharedState = !isShared;
    
    // Optimistic Update
    setIsShared(newSharedState);
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/category/${category.id}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShared: newSharedState }),
      });

      if (!res.ok) {
        throw new Error("Failed to update sharing settings");
      }

      const data = await res.json();
      setLocalCategory(data.category);
      onShareUpdate(data.category);
    } catch (err) {
      console.error(err);
      // Revert Optimistic Update
      setIsShared(previousSharedState);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await inviteMutation.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail("");
    } catch {
      // Error is handled by toast in hook
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div
        className="my-auto w-full max-w-md flex flex-col rounded-3xl bg-card border border-border shadow-2xl overflow-hidden relative text-foreground animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Share2 className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-sans font-bold text-foreground tracking-tight">
                Share Category
              </h2>
              <p className="text-xs font-medium text-muted-foreground">
                {category.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-card transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Public Access
              </span>
              <span className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Anyone with the link can view bookmarks in this category.
              </span>
            </div>
            
            <button
              onClick={handleToggleShare}
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isShared ? 'bg-emerald-500' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isShared ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {isShared && (
            <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                Public Link
              </label>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border text-muted-foreground text-sm font-mono focus:outline-none focus:border-foreground transition"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/80 transition shadow-sm cursor-pointer shrink-0"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Collaborators Section */}
          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Collaborators
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                Invite friends with granular access permissions.
              </span>
            </div>

            <form onSubmit={handleInvite} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="friend@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-muted-foreground text-sm focus:outline-none focus:border-indigo-500 transition"
              />
              <div className="flex gap-2">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "VIEWER" | "EDITOR")}
                  className="px-3 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none"
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                </select>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending || !inviteEmail.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold text-xs hover:bg-indigo-600 transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Invite
                </button>
              </div>
            </form>

            {isLoadingCollaborators ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /></div>
            ) : collaborators && collaborators.length > 0 ? (
              <div className="space-y-2 mt-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">People with access</span>
                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-2">
                  {collaborators.map((collab) => (
                    <div key={collab.id} className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-sm font-medium text-foreground truncate">{collab.user.name || "User"}</span>
                        <span className="text-xs text-muted-foreground truncate">{collab.user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={collab.role || "VIEWER"}
                          onChange={(e) => updateRoleMutation.mutate({ userId: collab.user.id, role: e.target.value as "VIEWER" | "EDITOR" })}
                          className="px-2 py-1 rounded-lg bg-muted text-[11px] font-medium border border-border text-foreground focus:outline-none"
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="EDITOR">Editor</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate(collab.user.id)}
                          disabled={removeMutation.isPending}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Remove access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-foreground hover:bg-card transition cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
