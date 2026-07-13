import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlotAssignment } from "../../types";
import { api } from "../api";

export function usePlotAssignments(plotId: string) {
  return useQuery({
    queryKey: ["plot-assignments", plotId],
    queryFn: async () => {
      try {
        return await api<{ assignments: PlotAssignment[] }>(
          `/api/mobile/me/plots/${plotId}/assignments`,
        );
      } catch (err: any) {
        // Student not assigned to this plot — treat as "no assignments"
        // instead of surfacing an error, matching the backend's read gate.
        if (err?.status === 403) {
          return { assignments: [] };
        }
        throw err;
      }
    },
    enabled: !!plotId,
  });
}

type AssignStudentInput = {
  plotId: string;
  studentId: string;
  notes?: string | null;
};

export function useAssignStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plotId, studentId, notes }: AssignStudentInput) =>
      api<{ assignment: PlotAssignment }>(
        `/api/mobile/me/plots/${plotId}/assignments`,
        {
          method: "POST",
          body: { studentId, notes: notes ?? undefined },
        },
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["plot-assignments", variables.plotId],
      });
      queryClient.invalidateQueries({ queryKey: ["plot", variables.plotId] });
    },
  });
}

type UnassignStudentInput = {
  plotId: string;
  assignmentId: string;
};

export function useUnassignStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plotId, assignmentId }: UnassignStudentInput) =>
      api<{ success: boolean }>(
        `/api/mobile/me/plots/${plotId}/assignments/${assignmentId}`,
        { method: "DELETE" },
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["plot-assignments", variables.plotId],
      });
      queryClient.invalidateQueries({ queryKey: ["plot", variables.plotId] });
    },
  });
}
