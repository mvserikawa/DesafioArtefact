"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  type TaskFormFieldErrors,
  validateTaskFormFields,
} from "@/lib/task-validation";
import type { Task } from "@/server/tasks-store";
import { useTRPC } from "@/trpc/client";

interface TaskFormProps {
  mode: "create" | "edit";
  initialTask?: Task;
}

/**
 * Extrai mensagem amigável e erros por campo vindos de uma falha tRPC/Zod.
 */
function extractBackendError(error: unknown): {
  message: string;
  fieldErrors: TaskFormFieldErrors;
} {
  const defaultMessage = "Não foi possível salvar a tarefa. Tente novamente.";
  if (!error || typeof error !== "object") {
    return { message: defaultMessage, fieldErrors: {} };
  }

  const errObj = error as {
    message?: string;
    data?: {
      zodError?: {
        fieldErrors?: {
          titulo?: string[];
          descricao?: string[];
        };
      } | null;
    };
  };

  const zodFields = errObj.data?.zodError?.fieldErrors;
  const fieldErrors: TaskFormFieldErrors = {
    titulo: zodFields?.titulo?.[0],
    descricao: zodFields?.descricao?.[0],
  };

  const firstFieldError = fieldErrors.titulo || fieldErrors.descricao;

  return {
    message: firstFieldError ?? (errObj.message || defaultMessage),
    fieldErrors,
  };
}

export function TaskForm({ mode, initialTask }: TaskFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();

  const [titulo, setTitulo] = useState(initialTask?.titulo ?? "");
  const [descricao, setDescricao] = useState(initialTask?.descricao ?? "");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<TaskFormFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const handleSuccess = async (message: string) => {
    await queryClient.invalidateQueries(trpc.task.pathFilter());
    showToast(message, "success");
    router.push("/");
    router.refresh();
  };

  const handleError = (error: unknown) => {
    const parsed = extractBackendError(error);
    setSubmitError(parsed.message);
    if (parsed.fieldErrors.titulo || parsed.fieldErrors.descricao) {
      setFieldErrors(parsed.fieldErrors);
    }
    showToast(parsed.message, "error");
  };

  const createMutation = useMutation(
    trpc.task.create.mutationOptions({
      onSuccess: () => handleSuccess("Tarefa criada com sucesso!"),
      onError: handleError,
    }),
  );

  const updateMutation = useMutation(
    trpc.task.update.mutationOptions({
      onSuccess: () => handleSuccess("Tarefa atualizada com sucesso!"),
      onError: handleError,
    }),
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleTitleChange = (value: string) => {
    setTitulo(value);
    setSubmitError(null);
    if (hasSubmitted) {
      setFieldErrors(validateTaskFormFields({ titulo: value, descricao }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescricao(value);
    setSubmitError(null);
    if (hasSubmitted) {
      setFieldErrors(validateTaskFormFields({ titulo, descricao: value }));
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);
    setSubmitError(null);

    const errors = validateTaskFormFields({ titulo, descricao });
    setFieldErrors(errors);

    if (errors.titulo || errors.descricao) {
      if (errors.titulo) {
        titleInputRef.current?.focus();
      }
      return;
    }

    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim() ? descricao.trim() : undefined,
    };

    if (mode === "edit" && initialTask) {
      updateMutation.mutate({
        id: initialTask.id,
        ...payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isEdit = mode === "edit";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para a listagem</span>
        </Link>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          {isEdit ? "Editar Tarefa" : "Nova Tarefa"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {isEdit
            ? "Atualize os dados da tarefa abaixo e salve as alterações."
            : "Preencha os campos abaixo para adicionar uma nova tarefa à lista."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="task-titulo"
              className="block text-sm font-medium text-slate-800"
            >
              Título <span className="text-red-600">*</span>
            </label>
            <span className="text-xs text-slate-400">
              {titulo.length}/{TASK_TITLE_MAX_LENGTH}
            </span>
          </div>

          <input
            ref={titleInputRef}
            id="task-titulo"
            name="titulo"
            type="text"
            required
            disabled={isPending}
            value={titulo}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Ex.: Revisar integração tRPC com Next.js 15"
            aria-invalid={Boolean(fieldErrors.titulo)}
            aria-describedby={
              fieldErrors.titulo ? "task-titulo-error" : undefined
            }
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
              fieldErrors.titulo
                ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
            }`}
          />

          {fieldErrors.titulo && (
            <p
              id="task-titulo-error"
              role="alert"
              className="text-xs font-medium text-red-600"
            >
              {fieldErrors.titulo}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="task-descricao"
              className="block text-sm font-medium text-slate-800"
            >
              Descrição <span className="text-xs text-slate-400">(opcional)</span>
            </label>
            <span className="text-xs text-slate-400">
              {descricao.length}/{TASK_DESCRIPTION_MAX_LENGTH}
            </span>
          </div>

          <textarea
            id="task-descricao"
            name="descricao"
            rows={4}
            disabled={isPending}
            value={descricao}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Adicione detalhes, contexto ou critérios para concluir esta tarefa..."
            aria-invalid={Boolean(fieldErrors.descricao)}
            aria-describedby={
              fieldErrors.descricao ? "task-descricao-error" : undefined
            }
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
              fieldErrors.descricao
                ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
            }`}
          />

          {fieldErrors.descricao && (
            <p
              id="task-descricao-error"
              role="alert"
              className="text-xs font-medium text-red-600"
            >
              {fieldErrors.descricao}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>
              {isPending
                ? isEdit
                  ? "Salvando..."
                  : "Criando..."
                : isEdit
                  ? "Salvar Alterações"
                  : "Criar Tarefa"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
