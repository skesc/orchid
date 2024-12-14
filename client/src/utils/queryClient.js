import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
      cacheTime: 30 * 60 * 1000, // Cache is kept for 30 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch when component remounts
      retry: 1, // Only retry failed requests once
    },
  },
});
