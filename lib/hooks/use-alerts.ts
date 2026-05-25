import { useQuery } from "@tanstack/react-query";
import type { AlertItem } from "../../types";
import { api } from "../api";

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => api<{ alerts: AlertItem[] }>("/api/mobile/me/alerts"),
  });
}
