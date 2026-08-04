import { useQuery } from "@tanstack/react-query";
import type { DashboardData } from "../../types";
import { api } from "../api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardData>("/api/mobile/me/dashboard"),
    refetchInterval: 10000, // live — matches useAlerts/usePlot, keeps Open Alerts in sync with the tab badge
  });
}
