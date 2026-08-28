"use client";

import { useState } from "react";
import { Folder as FolderIcon, Plus, Trash2 } from "lucide-react";
import { useFolders } from "../hooks/use-folders";
import { clsx } from "clsx";
import { toast } from "sonner";

interface FolderSidebarProps {
  activeFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
}

export function FolderSidebar({ activeFolderId, onSelectFolder }: FolderSidebarProps) {
  const { folders, isLoading, createFolder, deleteFolder } = useFolders();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await createFolder({ name: newFolderName.trim() });
    setNewFolderName("");
    setIsCreating(false);
  };

  return (
    <div className="w-56 shrink-0 border-r border-border bg-background flex-col hidden md:flex min-h-[500px]">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Folders</h3>
        <button 
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-card rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="New Folder"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => onSelectFolder(null)}
          className={clsx(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer",
            activeFolderId === null 
              ? "bg-primary/10 text-primary font-medium" 
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          )}
        >
          <FolderIcon className="w-4 h-4" />
          All Notes
        </button>

        {isLoading ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">Loading...</div>
        ) : (
          folders.map((folder) => (
            <div key={folder.id} className="group relative flex items-center">
              <button
                onClick={() => onSelectFolder(folder.id)}
                className={clsx(
                  "flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer",
                  activeFolderId === folder.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                )}
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: folder.color }} 
                />
                <span className="truncate">{folder.name}</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.error("Delete this folder?", {
                    description: "Notes inside will not be deleted.",
                    action: {
                      label: "Delete",
                      onClick: () => deleteFolder(folder.id),
                    },
                  });
                }}
                className="absolute right-1 opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-rose-400 transition-all rounded-md cursor-pointer"
                title="Delete Folder"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}

        {isCreating && (
          <form onSubmit={handleCreateFolder} className="px-2 py-1 mt-1">
            <input
              autoFocus
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => setIsCreating(false)}
              placeholder="Folder name..."
              className="w-full bg-card border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </form>
        )}
      </div>
    </div>
  );
}
