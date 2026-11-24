import "server-only";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { makeQueryClient } from "@/trpc/query-client";
import { appRouter } from "@/trpc/routers/_app";

/**
 * Garante um QueryClient e contexto estáveis por requisição durante o SSR,
 * evitando vazamento de cache entre usuários/requisições diferentes.
 */
export const getQueryClient = cache(makeQueryClient);
const getCachedContext = cache(() => createTRPCContext());

export const trpc = createTRPCOptionsProxy({
  ctx: getCachedContext,
  router: appRouter,
  queryClient: getQueryClient,
});

/**
 * Caller direto no servidor para leitura síncrona/direta em Server Components (ex: página de edição).
 */
export const serverCaller = createCallerFactory(appRouter)(getCachedContext);

export function HydrateClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
