import { QueryClient } from "@tanstack/react-query";

// make it HMR-safe so it doesn't recreate on every refresh in dev
let client: QueryClient | undefined;

export function getQueryClient() {
  if (!client) {
    client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: 0,
        },
      },
    });
  }
  return client;
}
