import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "../../types";
import { api } from "../api";
import { saveUser } from "../auth";

type UpdateProfileInput = {
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber?: string;
};

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      return api<{ user: User }>("/api/mobile/me/profile", {
        method: "PATCH",
        body: input,
      });
    },
    onSuccess: async (data) => {
      await saveUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
