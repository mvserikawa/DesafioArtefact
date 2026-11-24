"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { formatTaskDate } from "@/lib/date-format";
import { DEFAULT_TASKS_PAGE_SIZE } from "@/lib/task-validation";
import { useTRPC } from "@/trpc/client";

interface InlineFeedback {
  variant: "success" | "error";
  message: string;
}

export function TaskList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<InlineFeedback | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const tasksQuery = useInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(
      { limit: DEFAULT_TASKS_PAGE_SIZE },
      {
        initialCursor: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  );

  const deleteMutation = useMutation(
    trpc.task.delete.mutationOptions({
      onMutate: (variables) => {
        setDeletingId(variables.id);
        setFeedback(null);
      },
      onSuccess: async () => {
        const message = "Tarefa excluída com sucesso.";
        setFeedback({ variant: "success", message });
        showToast(message, "success");
        await queryClient.invalidateQueries(trpc.task.pathFilter());
      },
      onError: (error) => {
        const message =
          error.message || "Ocorreu um erro ao tentar excluir a tarefa.";
        setFeedback({ variant: "error", message });
        showToast(message, "error");
      },
      onSettled: () => {
        setDeletingId(null);
      },
    }),
  );

  const {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = tasksQuery;

  // Carregamento incremental (Infinite Scroll) quando o sentinela entra na viewport
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (
          firstEntry?.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          !isFetchNextPageError
        ) {
          void fetchNextPage();
        }
      },
      { rootMargin: "160px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const tasks = tasksQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const totalTasks = tasksQuery.data?.pages[0]?.total ?? tasks.length;

  return (
    <section aria-label="Lista de tarefas" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Minhas Tarefas
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {tasksQuery.isPending
              ? "Carregando tarefas..."
              : totalTasks === 0
                ? "Nenhuma tarefa cadastrada no momento."
                : `Exibindo ${tasks.length} de ${totalTasks} ${
                    totalTasks === 1 ? "tarefa" : "tarefas"
                  }.`}
          </p>
        </div>

        <Link
          href="/tarefas/nova"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          <span>Criar Nova Tarefa</span>
        </Link>
      </div>

      {feedback && (
        <div
          role={feedback.variant === "error" ? "alert" : "status"}
          className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            feedback.variant === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.variant === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Fechar mensagem"
            className="rounded p-0.5 opacity-70 transition hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {tasksQuery.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
        >
          <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
          <h2 className="mt-2 text-base font-semibold text-red-900">
            Erro ao carregar as tarefas
          </h2>
          <p className="mt-1 text-sm text-red-700">
            {tasksQuery.error.message ||
              "Não foi possível se comunicar com o servidor."}
          </p>
          <button
            type="button"
            onClick={() => void tasksQuery.refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Tentar novamente</span>
          </button>
        </div>
      ) : tasksQuery.isPending ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white p-5"
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-base font-medium text-slate-800">
            Sua lista de tarefas está vazia.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Adicione uma nova tarefa para começar a organizar suas atividades.
          </p>
          <Link
            href="/tarefas/nova"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar primeira tarefa</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isDeleting = deletingId === task.id;
            return (
              <article
                key={task.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 sm:flex-row sm:items-start"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <h2 className="break-words text-base font-semibold text-slate-900">
                    {task.titulo}
                  </h2>

                  {task.descricao ? (
                    <p className="break-words text-sm leading-relaxed text-slate-600">
                      {task.descricao}
                    </p>
                  ) : (
                    <p className="text-sm italic text-slate-400">
                      Sem descrição
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Criada em {formatTaskDate(task.dataCriacao)}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
                  <Link
                    href={`/tarefas/${task.id}/editar`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Editar</span>
                  </Link>

                  <button
                    type="button"
                    disabled={isDeleting || deleteMutation.isPending}
                    aria-busy={isDeleting}
                    onClick={() => deleteMutation.mutate({ id: task.id })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span>{isDeleting ? "Excluindo..." : "Excluir"}</span>
                  </button>
                </div>
              </article>
            );
          })}

          {/* Elemento sentinela e controles do Infinite Scroll */}
          <div ref={loadMoreRef} className="pt-4 text-center">
            {isFetchNextPageError ? (
              <div className="inline-flex flex-col items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <span>Erro ao carregar mais tarefas.</span>
                <button
                  type="button"
                  onClick={() => void fetchNextPage()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Tentar carregar novamente</span>
                </button>
              </div>
            ) : isFetchingNextPage ? (
              <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Carregando mais tarefas...</span>
              </div>
            ) : hasNextPage ? (
              <button
                type="button"
                onClick={() => void fetchNextPage()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs transition hover:bg-slate-50"
              >
                Carregar mais tarefas
              </button>
            ) : (
              <p className="text-xs text-slate-400">
                Todas as {totalTasks} tarefas foram carregadas.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
