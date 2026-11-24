import type { Metadata } from "next";
import { TaskForm } from "@/components/TaskForm";

export const metadata: Metadata = {
  title: "Nova Tarefa | Gerenciador de Tarefas",
};

export default function NovaTarefaPage() {
  return <TaskForm mode="create" />;
}
