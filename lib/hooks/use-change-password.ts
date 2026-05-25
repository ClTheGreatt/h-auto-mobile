import { useMutation } from "@tanstack/react-query";
import { api } from "../api";

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      return api<{ success: boolean }>("/api/mobile/me/change-password", {
        method: "POST",
        body: input,
      });
    },
  });
}
