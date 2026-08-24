"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Note } from "../components/notes-card";

export function useNotes() {
  const queryClient = useQueryClient();

  const notesQuery = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const res = await fetch("/api/note");
      if (!res.ok) throw new Error("Failed to fetch notes");
      const data = await res.json();
      return (data.notes as Note[]) || [];
    },
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  });

  const saveNoteMutation = useMutation({
    mutationFn: async (noteData: Partial<Note> & { title: string; content: string }) => {
      const isEdit = Boolean(noteData.id);
      const endpoint = isEdit ? `/api/note/${noteData.id}` : "/api/note";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save note");
      }

      const data = await res.json();
      return data.note as Note;
    },
    onMutate: async (newNoteData) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const previousNotes = queryClient.getQueryData<Note[]>(["notes"]);
      let tempId = "";

      if (previousNotes) {
        if (newNoteData.id) {
          queryClient.setQueryData<Note[]>(["notes"], (old) =>
            old
              ? old.map((n) =>
                  n.id === newNoteData.id
                    ? ({
                        ...n,
                        ...newNoteData,
                        updatedAt: new Date().toISOString(),
                      } as Note)
                    : n
                )
              : []
          );
        } else {
          tempId = `temp-${Date.now()}`;
          const tempNote: Note = {
            id: tempId,
            title: newNoteData.title || "Untitled Note",
            content: newNoteData.content,
            tags: newNoteData.tags || [],
            isBookmarked: newNoteData.isBookmarked || false,
            isPinned: newNoteData.isPinned || false,
            folderId: newNoteData.folderId || null,
            userId: "temp-user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          queryClient.setQueryData<Note[]>(["notes"], (old) => [
            tempNote,
            ...(old || []),
          ]);
        }
      }

      return { previousNotes, tempId };
    },
    onError: (_err, _newNote, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(["notes"], context.previousNotes);
      }
    },
    onSuccess: (savedNote, variables, context) => {
      queryClient.setQueryData<Note[]>(["notes"], (old) => {
        if (!old) return [savedNote];
        if (variables.id) {
          return old.map((n) => (n.id === variables.id ? savedNote : n));
        } else if (context?.tempId) {
          return old.map((n) => (n.id === context.tempId ? savedNote : n));
        }
        return old;
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/note/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const previousNotes = queryClient.getQueryData<Note[]>(["notes"]);

      if (previousNotes) {
        queryClient.setQueryData<Note[]>(["notes"], (old) =>
          old ? old.filter((n) => n.id !== id) : []
        );
      }

      return { previousNotes };
    },
    onError: (_err, _id, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(["notes"], context.previousNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (updateData: Partial<Note> & { id: string }) => {
      const res = await fetch(`/api/note/${updateData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) throw new Error("Failed to update note");
      const data = await res.json();
      return data.note as Note;
    },
    onMutate: async (updateData) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const previousNotes = queryClient.getQueryData<Note[]>(["notes"]);

      if (previousNotes) {
        queryClient.setQueryData<Note[]>(["notes"], (old) =>
          old
            ? old.map((n) =>
                n.id === updateData.id
                  ? ({ ...n, ...updateData, updatedAt: new Date().toISOString() } as Note)
                  : n
              )
            : []
        );
      }
      return { previousNotes };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousNotes) queryClient.setQueryData(["notes"], context.previousNotes);
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData<Note[]>(["notes"], (old) => {
        if (!old) return [];
        return old.map((n) => (n.id === updatedNote.id ? updatedNote : n));
      });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: async (payload: {
      action: "delete" | "update";
      noteIds: string[];
      folderId?: string | null;
      isPinned?: boolean;
      isBookmarked?: boolean;
    }) => {
      const res = await fetch("/api/note/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Bulk action failed");
      return payload;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const previousNotes = queryClient.getQueryData<Note[]>(["notes"]);

      if (previousNotes) {
        queryClient.setQueryData<Note[]>(["notes"], (old) => {
          if (!old) return [];
          if (payload.action === "delete") {
            return old.filter((n) => !payload.noteIds.includes(n.id));
          }
          if (payload.action === "update") {
            return old.map((n) => {
              if (payload.noteIds.includes(n.id)) {
                return {
                  ...n,
                  ...(payload.folderId !== undefined && { folderId: payload.folderId }),
                  ...(payload.isPinned !== undefined && { isPinned: payload.isPinned }),
                  ...(payload.isBookmarked !== undefined && { isBookmarked: payload.isBookmarked }),
                  updatedAt: new Date().toISOString(),
                } as Note;
              }
              return n;
            });
          }
          return old;
        });
      }
      return { previousNotes };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousNotes) queryClient.setQueryData(["notes"], context.previousNotes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  return {
    notes: notesQuery.data || [],
    isLoading: notesQuery.isLoading,
    isError: notesQuery.isError,
    error: notesQuery.error,
    saveNote: saveNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    toggleBookmark: (id: string, isBookmarked: boolean) => updateNoteMutation.mutateAsync({ id, isBookmarked }),
    togglePin: (id: string, isPinned: boolean) => updateNoteMutation.mutateAsync({ id, isPinned }),
    moveToFolder: (id: string, folderId: string | null) => updateNoteMutation.mutateAsync({ id, folderId }),
    bulkAction: bulkActionMutation.mutateAsync,
    isSaving: saveNoteMutation.isPending,
  };
}
