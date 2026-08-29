import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface NoteCollaborator {
  id: string;
  role?: "VIEWER" | "EDITOR";
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function useNoteCollaboratorsQuery(noteId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["note-collaborators", noteId],
    queryFn: async (): Promise<NoteCollaborator[]> => {
      const res = await fetch(`/api/note/${noteId}/collaborators`);
      if (!res.ok) {
        throw new Error("Failed to fetch note collaborators");
      }
      const data = await res.json();
      return data.collaborators || [];
    },
    enabled,
  });
}

export function useInviteNoteCollaboratorMutation(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role?: "VIEWER" | "EDITOR" }) => {
      const res = await fetch(`/api/note/${noteId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: role || "VIEWER" }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to invite collaborator");
      }
      return res.json();
    },
    onMutate: async ({ email, role }) => {
      await queryClient.cancelQueries({ queryKey: ["note-collaborators", noteId] });

      const previous = queryClient.getQueryData<NoteCollaborator[]>(["note-collaborators", noteId]) || [];

      const optimistic: NoteCollaborator = {
        id: `temp-${Date.now()}`,
        role: role || "VIEWER",
        user: {
          id: `temp-user-${Date.now()}`,
          name: "Sending invite...",
          email,
          image: null,
        },
      };

      queryClient.setQueryData<NoteCollaborator[]>(["note-collaborators", noteId], (old = []) => [
        ...old,
        optimistic,
      ]);

      return { previous };
    },
    onSuccess: () => {
      toast.success("Note collaborator invited successfully!");
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["note-collaborators", noteId], context.previous);
      }
      toast.error(error.message || "Failed to invite collaborator");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["note-collaborators", noteId] });
    },
  });
}

export function useUpdateNoteCollaboratorRoleMutation(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "VIEWER" | "EDITOR" }) => {
      const res = await fetch(`/api/note/${noteId}/collaborators/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update role");
      }
      return res.json();
    },
    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: ["note-collaborators", noteId] });

      const previous = queryClient.getQueryData<NoteCollaborator[]>(["note-collaborators", noteId]) || [];

      queryClient.setQueryData<NoteCollaborator[]>(["note-collaborators", noteId], (old = []) =>
        old.map((collab) =>
          collab.user.id === userId ? { ...collab, role } : collab
        )
      );

      return { previous };
    },
    onSuccess: () => {
      toast.success("Permission updated.");
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["note-collaborators", noteId], context.previous);
      }
      toast.error(error.message || "Failed to update role");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["note-collaborators", noteId] });
    },
  });
}

export function useRemoveNoteCollaboratorMutation(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/note/${noteId}/collaborators/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to remove collaborator");
      }
      return res.json();
    },
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ["note-collaborators", noteId] });

      const previous = queryClient.getQueryData<NoteCollaborator[]>(["note-collaborators", noteId]) || [];

      queryClient.setQueryData<NoteCollaborator[]>(["note-collaborators", noteId], (old = []) =>
        old.filter((collab) => collab.user.id !== userId)
      );

      return { previous };
    },
    onSuccess: () => {
      toast.success("Collaborator removed.");
    },
    onError: (error: Error, _userId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["note-collaborators", noteId], context.previous);
      }
      toast.error(error.message || "Failed to remove collaborator");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["note-collaborators", noteId] });
    },
  });
}
