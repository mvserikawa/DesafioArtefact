import { createTRPCRouter } from "@/trpc/init";
import { taskRouter } from "@/trpc/routers/task";

export const appRouter = createTRPCRouter({
  task: taskRouter,
});

// Exporta apenas a definição de tipo para consumo seguro no cliente
export type AppRouter = typeof appRouter;
