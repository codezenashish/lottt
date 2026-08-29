import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Collaborator {
  id: string;
  role?: "VIEWER" | "EDITOR";
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function useCollaboratorsQuery(categoryId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["collaborators", categoryId],
    queryFn: async (): Promise<Collaborator[]> => {
      const res = await fetch(`/api/category/${categoryId}/collaborators`);
      if (!res.ok) {
        throw new Error("Failed to fetch collaborators");
      }
      const data = await res.json();
      return data.collaborators || [];
    },
    enabled,
  });
}

export function useInviteCollaboratorMutation(categoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role?: "VIEWER" | "EDITOR" }) => {
      const res = await fetch(`/api/category/${categoryId}/invite`, {
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
      await queryClient.cancelQueries({ queryKey: ["collaborators", categoryId] });

      const previousCollaborators = queryClient.getQueryData<Collaborator[]>(["collaborators", categoryId]) || [];

      // Optimistically add placeholder
      const optimisticCollaborator: Collaborator = {
        id: `temp-${Date.now()}`,
        role: role || "VIEWER",
        user: {
          id: `temp-user-${Date.now()}`,
          name: "Sending invite...",
          email: email,
          image: null,
        },
      };

      queryClient.setQueryData<Collaborator[]>(["collaborators", categoryId], (old = []) => [
        ...old,
        optimisticCollaborator,
      ]);

      return { previousCollaborators };
    },
    onSuccess: () => {
      toast.success("Collaborator invited successfully!");
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previousCollaborators) {
        queryClient.setQueryData(["collaborators", categoryId], context.previousCollaborators);
      }
      toast.error(error.message || "Failed to invite collaborator");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators", categoryId] });
    },
  });
}

export function useUpdateCollaboratorRoleMutation(categoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "VIEWER" | "EDITOR" }) => {
      const res = await fetch(`/api/category/${categoryId}/collaborators/${userId}/role`, {
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
      await queryClient.cancelQueries({ queryKey: ["collaborators", categoryId] });

      const previousCollaborators = queryClient.getQueryData<Collaborator[]>(["collaborators", categoryId]) || [];

      queryClient.setQueryData<Collaborator[]>(["collaborators", categoryId], (old = []) =>
        old.map((collab) =>
          collab.user.id === userId ? { ...collab, role } : collab
        )
      );

      return { previousCollaborators };
    },
    onSuccess: () => {
      toast.success("Collaborator permission updated.");
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previousCollaborators) {
        queryClient.setQueryData(["collaborators", categoryId], context.previousCollaborators);
      }
      toast.error(error.message || "Failed to update role.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators", categoryId] });
    },
  });
}

export function useRemoveCollaboratorMutation(categoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/category/${categoryId}/collaborators/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to remove collaborator");
      }
      return res.json();
    },
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ["collaborators", categoryId] });

      const previousCollaborators = queryClient.getQueryData<Collaborator[]>(["collaborators", categoryId]) || [];

      // Optimistically remove user
      queryClient.setQueryData<Collaborator[]>(["collaborators", categoryId], (old = []) => 
        old.filter((collab) => collab.user.id !== userId)
      );

      return { previousCollaborators };
    },
    onSuccess: () => {
      toast.success("Collaborator removed.");
    },
    onError: (error: Error, _userId, context) => {
      if (context?.previousCollaborators) {
        queryClient.setQueryData(["collaborators", categoryId], context.previousCollaborators);
      }
      toast.error(error.message || "Failed to remove collaborator");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators", categoryId] });
    },
  });
}
