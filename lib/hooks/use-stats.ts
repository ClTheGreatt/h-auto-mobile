import { useQuery } from "@tanstack/react-query";
import type { UserStats } from "../../types";
import { api } from "../api";

export function useStats() {
  return useQuery({
    queryKey: ["my-stats"],
    queryFn: () => api<{ stats: UserStats }>("/api/mobile/me/stats"),
  });
}
