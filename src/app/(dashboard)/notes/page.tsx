"use client";

import { useState, useEffect } from "react";
import { NotesGrid } from "@/features/notes/components/notes-grid";
import { NotionEditor } from "@/features/notes/components/notion-editor";
import { Note } from "@/features/notes/components/notes-card";
import { useNotes } from "@/features/notes/hooks/use-notes";
import { FolderSidebar } from "@/features/notes/components/folder-sidebar";
import { useKeyboardShortcuts } from "@/features/notes/hooks/use-keyboard-shortcuts";
import { ShareNoteDialog } from "@/features/notes/dialogs/share-note-dialog";

export default function NotesPage() {
  const [activeNote, setActiveNote] = useState<Note | "new" | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [sharingNote, setSharingNote] = useState<Note | null>(null);
  const { notes, isLoading, isError, error, saveNote, deleteNote, togglePin, toggleBookmark } = useNotes();

  useEffect(() => {
    const handleOpenNewNote = () => setActiveNote("new");
    window.addEventListener("open-new-note", handleOpenNewNote);
    return () => window.removeEventListener("open-new-note", handleOpenNewNote);
  }, []);

  useKeyboardShortcuts(
    {
      "cmd+n": () => {
        if (activeNote === null) {
          setActiveNote("new");
        }
      },
      "ctrl+n": () => {
        if (activeNote === null) {
          setActiveNote("new");
        }
      },
    },
    activeNote === null // Only listen when grid is active
  );

  const handleSaveNote = async (noteData: {
    id?: string;
    title: string;
    content: string;
    tags?: string[];
    isPinned?: boolean;
    isBookmarked?: boolean;
    folderId?: string | null;
  }) => {
    // Inject activeFolderId if creating a new note within a folder
    if (!noteData.id && activeFolderId) {
      noteData.folderId = activeFolderId;
    }
    const saved = await saveNote(noteData);
    setActiveNote((prev) => (prev ? saved : null));
    return saved;
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
  };

  const displayedNotes = activeFolderId ? notes.filter((n) => n.folderId === activeFolderId) : notes;

  return (
    <div className="flex h-full min-h-[calc(100vh-6rem)] w-full min-w-0 overflow-x-hidden">
      {activeNote === null && (
        <FolderSidebar 
          activeFolderId={activeFolderId} 
          onSelectFolder={setActiveFolderId} 
        />
      )}
      
      <div className="flex-1 py-6 px-3 sm:px-6 md:px-8 space-y-6 overflow-y-auto min-w-0 overflow-x-hidden scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
            {error?.message || "An error occurred loading notes."}
          </div>
        )}

        {activeNote !== null ? (
          <NotionEditor
            note={typeof activeNote === "object" ? activeNote : null}
            activeFolderId={activeFolderId}
            onBack={() => setActiveNote(null)}
            onSave={handleSaveNote}
            onDelete={handleDeleteNote}
          />
        ) : (
          <NotesGrid
            notes={displayedNotes}
            isLoading={isLoading}
            onSelectNote={(note) => setActiveNote(note)}
            onDeleteNote={handleDeleteNote}
            onShareNote={(note) => setSharingNote(note)}
            onTogglePin={togglePin}
            onToggleBookmark={toggleBookmark}
          />
        )}
      </div>

      {sharingNote && (
        <ShareNoteDialog
          isOpen={Boolean(sharingNote)}
          onClose={() => setSharingNote(null)}
          note={sharingNote}
        />
      )}
    </div>
  );
}
