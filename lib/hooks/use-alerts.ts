import { useQuery } from "@tanstack/react-query";
import type { AlertItem } from "../../types";
import { api } from "../api";

export type AlertQueryStatus = "open" | "resolved";

export function useAlerts(status: AlertQueryStatus = "open") {
  const path =
    status === "resolved"
      ? "/api/mobile/me/alerts?status=resolved"
      : "/api/mobile/me/alerts";

  return useQuery({
    queryKey: ["alerts", status],
    queryFn: () => api<{ alerts: AlertItem[] }>(path),
    refetchInterval: 10000, // live — para mag-update ang badge + list
  });
}

// Bilang ng open (hindi pa resolved) alerts — para sa tab badge
export function useOpenAlertsCount(): number {
  const { data } = useAlerts("open");
  return data?.alerts.length ?? 0;
}
