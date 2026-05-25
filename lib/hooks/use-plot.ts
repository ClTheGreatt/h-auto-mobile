import { useQuery } from "@tanstack/react-query";
import type { PlotDetail } from "../../types";
import { api } from "../api";

export function usePlot(id: string | undefined) {
  return useQuery({
    queryKey: ["plot", id],
    queryFn: () => api<{ plot: PlotDetail }>(`/api/mobile/me/plots/${id}`),
    enabled: !!id,
    refetchInterval: 10000, // poll every 10s for near real-time readings
    refetchIntervalInBackground: false, // pause when app is backgrounded
  });
}
