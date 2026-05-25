// lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 1 minute fresh, 5 minutes cached
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
      // Retry failed requests 2 times before giving up
      retry: 2,
      // Mobile-specific: don't refetch on window focus (no real "window focus" sa mobile)
      refetchOnWindowFocus: false,
      // Refetch when app comes back to foreground
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
