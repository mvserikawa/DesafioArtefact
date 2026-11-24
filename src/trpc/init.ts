import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod";
import { type InMemoryTaskStore, taskStore } from "@/server/tasks-store";

export interface TRPCContext {
  store: InMemoryTaskStore;
}

/**
 * Cria o contexto de execução das procedures tRPC.
 * Injeta o repositório em memória, permitindo substituição fácil em testes.
 */
export async function createTRPCContext(
  store: InMemoryTaskStore = taskStore,
): Promise<TRPCContext> {
  return { store };
}

/**
 * Inicialização do tRPC com Superjson (preserva tipos avançados na serialização)
 * e errorFormatter expondo erros de validação Zod de forma estruturada para o frontend.
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? z.flattenError(error.cause) : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
