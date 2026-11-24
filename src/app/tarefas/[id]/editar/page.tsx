import { TRPCError } from "@trpc/server";
import { AlertCircle, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TaskForm } from "@/components/TaskForm";
import type { Task } from "@/server/tasks-store";
import { serverCaller } from "@/trpc/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar Tarefa | Gerenciador de Tarefas",
};

interface EditarTarefaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarTarefaPage({
  params,
}: EditarTarefaPageProps) {
  const { id } = await params;

  let task: Task | null = null;
  let errorMessage: string | null = null;

  try {
    task = await serverCaller.task.byId({ id });
  } catch (error) {
    if (error instanceof TRPCError) {
      errorMessage = error.message;
    } else {
      errorMessage = "Erro inesperado ao carregar a tarefa.";
    }
  }

  if (!task) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-9 w-9 text-red-600" />
        <h1 className="mt-3 text-lg font-semibold text-red-900">
          Tarefa não encontrada
        </h1>
        <p className="mt-1 text-sm text-red-700">
          {errorMessage ??
            "A tarefa solicitada não existe ou já foi removida."}
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para a listagem</span>
        </Link>
      </div>
    );
  }

  return <TaskForm mode="edit" initialTask={task} />;
}
