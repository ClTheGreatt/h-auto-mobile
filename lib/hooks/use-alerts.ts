import { useQuery } from "@tanstack/react-query";
import type { AlertItem } from "../../types";
import { api } from "../api";

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => api<{ alerts: AlertItem[] }>("/api/mobile/me/alerts"),
    refetchInterval: 10000, // live — para mag-update ang badge + list
  });
}

// Bilang ng open (hindi pa resolved) alerts — para sa tab badge
export function useOpenAlertsCount(): number {
  const { data } = useAlerts();
  return data?.alerts.filter((a) => !a.resolved).length ?? 0;
}
