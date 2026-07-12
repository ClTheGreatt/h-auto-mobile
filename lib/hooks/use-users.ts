import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserDetail, UserListItem } from "../../types";
import { api } from "../api";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => api<{ users: UserListItem[] }>("/api/mobile/me/users"),
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => api<{ user: UserDetail }>(`/api/mobile/me/users/${id}`),
    enabled: !!id,
  });
}

type CreateUserInput = {
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role: string;
  password: string;
  status?: string;
  idNumber?: string;
  phoneNumber?: string;
  department?: string;
  course?: string;
  yearLevel?: string;
  section?: string;
  position?: string;
};

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      api<{ user: UserListItem }>("/api/mobile/me/users", {
        method: "POST",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api<{ user: UserListItem }>(`/api/mobile/me/users/${id}`, {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

type ImportResult = {
  success: string[];
  failed: { email: string; reason: string }[];
  totalProcessed: number;
};

type ImportInput = {
  type: string;
  rows: Record<string, string>[];
  fileName: string;
};

export function useImportUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportInput) =>
      api<ImportResult>("/api/mobile/me/users/import", {
        method: "POST",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
