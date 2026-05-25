import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "../../types";
import { api } from "../api";
import { saveUser } from "../auth";

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageUri: string) => {
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        name: `avatar-${Date.now()}.jpg`,
        type: "image/jpeg",
      } as any);

      return api<{ user: User }>("/api/mobile/me/avatar", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: async (data) => {
      await saveUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
