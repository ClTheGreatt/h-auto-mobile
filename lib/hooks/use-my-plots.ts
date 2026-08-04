import { useQuery } from "@tanstack/react-query";
import type { Plot } from "../../types";
import { api } from "../api";

export function useMyPlots() {
  return useQuery({
    queryKey: ["my-plots"],
    queryFn: () => api<{ plots: Plot[] }>("/api/mobile/me/plots"),
    refetchInterval: 10000, // live — matches useAlerts/usePlot, keeps per-plot alert badges in sync with the tab badge
  });
}
