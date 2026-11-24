import { z } from "zod";
import {
  createTaskInputSchema,
  listTasksInputSchema,
  taskIdSchema,
  updateTaskInputSchema,
} from "@/lib/task-validation";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";

/**
 * Roteador tRPC responsável pelas operações CRUD de tarefas.
 */
export const taskRouter = createTRPCRouter({
  /**
   * Lista tarefas com paginação por cursor (offset) para suportar SSR e Infinite Scroll.
   */
  list: baseProcedure.input(listTasksInputSchema).query(({ ctx, input }) => {
    return ctx.store.list(input);
  }),

  /**
   * Busca uma tarefa específica pelo ID (usado na página de edição).
   */
  byId: baseProcedure
    .input(z.object({ id: taskIdSchema }))
    .query(({ ctx, input }) => {
      return ctx.store.getById(input.id);
    }),

  /**
   * Cria uma nova tarefa garantindo título não vazio e gerando id + dataCriacao no servidor.
   */
  create: baseProcedure
    .input(createTaskInputSchema)
    .mutation(({ ctx, input }) => {
      return ctx.store.create(input);
    }),

  /**
   * Atualiza título e descrição de uma tarefa existente; retorna NOT_FOUND se não existir.
   */
  update: baseProcedure
    .input(updateTaskInputSchema)
    .mutation(({ ctx, input }) => {
      return ctx.store.update(input);
    }),

  /**
   * Remove uma tarefa existente pelo ID; retorna NOT_FOUND se não existir.
   */
  delete: baseProcedure
    .input(z.object({ id: taskIdSchema }))
    .mutation(({ ctx, input }) => {
      return ctx.store.delete(input.id);
    }),
});
