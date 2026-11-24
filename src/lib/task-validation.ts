import { z } from "zod";

export const TASK_TITLE_MAX_LENGTH = 120;
export const TASK_DESCRIPTION_MAX_LENGTH = 1000;
export const DEFAULT_TASKS_PAGE_SIZE = 8;

/**
 * Schemas compartilhados entre backend (tRPC + Zod) e frontend (formulário),
 * garantindo mensagens de validação consistentes em toda a aplicação.
 */
export const taskTitleSchema = z
  .string({ error: "O título é obrigatório." })
  .trim()
  .min(1, "O título não pode ficar vazio.")
  .max(
    TASK_TITLE_MAX_LENGTH,
    `O título deve ter no máximo ${TASK_TITLE_MAX_LENGTH} caracteres.`,
  );

export const taskDescriptionSchema = z
  .string()
  .trim()
  .max(
    TASK_DESCRIPTION_MAX_LENGTH,
    `A descrição deve ter no máximo ${TASK_DESCRIPTION_MAX_LENGTH} caracteres.`,
  )
  .optional();

export const taskIdSchema = z
  .string({ error: "O ID da tarefa é obrigatório." })
  .trim()
  .min(1, "O ID da tarefa é obrigatório.");

export const createTaskInputSchema = z.object({
  titulo: taskTitleSchema,
  descricao: taskDescriptionSchema,
});

export const updateTaskInputSchema = z.object({
  id: taskIdSchema,
  titulo: taskTitleSchema,
  descricao: taskDescriptionSchema,
});

export const listTasksInputSchema = z
  .object({
    cursor: z.number().int().min(0).optional(),
    limit: z.number().int().min(1).max(50).default(DEFAULT_TASKS_PAGE_SIZE),
  })
  .optional();

export interface TaskFormFieldErrors {
  titulo?: string;
  descricao?: string;
}

/**
 * Valida os campos do formulário de tarefa usando o mesmo schema Zod do backend.
 */
export function validateTaskFormFields(values: {
  titulo: string;
  descricao: string;
}): TaskFormFieldErrors {
  const result = createTaskInputSchema.safeParse({
    titulo: values.titulo,
    descricao: values.descricao.trim() ? values.descricao : undefined,
  });

  if (result.success) {
    return {};
  }

  const flattened = z.flattenError(result.error);
  return {
    titulo: flattened.fieldErrors.titulo?.[0],
    descricao: flattened.fieldErrors.descricao?.[0],
  };
}
