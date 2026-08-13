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
        // The server returns 401 for "current password is incorrect", not
        // just for an invalid/expired token — don't let the global
        // interceptor treat a typo as a session expiring.
        skipAuthRedirect: true,
      });
    },
  });
}
