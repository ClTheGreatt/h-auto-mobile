import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../api";

export type PlotReading = {
  id: string;
  recordedAt: string;
  soilMoisture: number | null;
  temperature: number | null;
  humidity: number | null;
  lightIntensity: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
};

type Page = { readings: PlotReading[]; nextCursor: string | null };

export function usePlotReadings(
  id: string | undefined,
  opts: {
    month?: string | null;
    range?: string | null;
    order?: "asc" | "desc";
  } = {},
) {
  const { month = null, range = null, order = "desc" } = opts;

  const buildQs = (cursor: string | null) => {
    const p = new URLSearchParams();
    if (month) p.set("month", month);
    else if (range) p.set("range", range);
    if (order) p.set("order", order);
    if (cursor) p.set("cursor", cursor);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return useInfiniteQuery({
    queryKey: ["plot-readings", id, month ?? range ?? "all", order],
    queryFn: ({ pageParam }) =>
      api<Page>(`/api/mobile/me/plots/${id}/readings${buildQs(pageParam)}`),
    enabled: !!id,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
