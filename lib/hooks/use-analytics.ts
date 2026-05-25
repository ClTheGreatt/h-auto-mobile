import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "../../types";
import { api } from "../api";

export function useAnalytics(
  plotId?: string | null,
  range: string = "7d",
  month?: string | null,
) {
  const params = new URLSearchParams();
  if (plotId) params.set("plotId", plotId);
  if (month) params.set("month", month);
  else if (range) params.set("range", range);
  const qs = params.toString();

  return useQuery({
    queryKey: ["analytics", plotId ?? "all", month ?? range],
    queryFn: () =>
      api<AnalyticsData>(`/api/mobile/me/analytics${qs ? `?${qs}` : ""}`),
  });
}
