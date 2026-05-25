import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

type CreateObservationInput = {
  plotId: string;
  imageUri?: string | null;
  plantHeightCm?: number | null;
  leafCount?: number | null;
  observations?: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string;
};

export function useCreateObservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateObservationInput) => {
      const formData = new FormData();

      if (input.imageUri) {
        formData.append("image", {
          uri: input.imageUri,
          name: `observation-${Date.now()}.jpg`,
          type: "image/jpeg",
        } as any);
      }

      if (input.plantHeightCm != null) {
        formData.append("plantHeightCm", String(input.plantHeightCm));
      }
      if (input.leafCount != null) {
        formData.append("leafCount", String(input.leafCount));
      }
      if (input.observations) {
        formData.append("observations", input.observations);
      }
      if (input.notes) {
        formData.append("notes", input.notes);
      }
      if (input.latitude != null && input.longitude != null) {
        formData.append("latitude", String(input.latitude));
        formData.append("longitude", String(input.longitude));
      }
      if (input.locationName) {
        // ← ADD
        formData.append("locationName", input.locationName); // ← ADD
      }

      return api<{ success: boolean; observation: { id: string } }>(
        `/api/mobile/me/plots/${input.plotId}/observations`,
        {
          method: "POST",
          body: formData,
        },
      );
    },
    onSuccess: (_, variables) => {
      // Refresh plot detail and plots list
      queryClient.invalidateQueries({ queryKey: ["plot", variables.plotId] });
      queryClient.invalidateQueries({ queryKey: ["my-plots"] });
    },
  });
}
