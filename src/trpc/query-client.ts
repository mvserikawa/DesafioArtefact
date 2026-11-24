import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import superjson from "superjson";

/**
 * Fábrica do QueryClient usada tanto no servidor (por requisição) quanto no cliente.
 * Utiliza Superjson para serializar/desserializar o cache hidratado entre SSR e navegador.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Evita refetch imediato no cliente logo após a hidratação SSR
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
        shouldRedactErrors: () => false,
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
