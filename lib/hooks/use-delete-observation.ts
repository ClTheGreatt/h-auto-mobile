import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

type DeleteObservationInput = {
  plotId: string;
  logId: string;
};

export function useDeleteObservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ plotId, logId }: DeleteObservationInput) =>
      api<{ success: boolean }>(
        `/api/mobile/me/plots/${plotId}/observations/${logId}`,
        { method: "DELETE" },
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plot", variables.plotId] });
      queryClient.invalidateQueries({ queryKey: ["my-plots"] });
    },
  });
}
