import { useQuery } from "@tanstack/react-query";
import type { Plot } from "../../types";
import { api } from "../api";

export function useMyPlots() {
  return useQuery({
    queryKey: ["my-plots"],
    queryFn: () => api<{ plots: Plot[] }>("/api/mobile/me/plots"),
  });
}
