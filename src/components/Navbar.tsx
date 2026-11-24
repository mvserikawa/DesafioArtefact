"use client";

import { CheckSquare, ListTodo, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isNew = pathname === "/tarefas/nova";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-slate-900 transition hover:opacity-80"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <CheckSquare className="h-5 w-5" />
          </span>
          <div>
            <span className="block text-base font-semibold leading-tight">
              Gerenciador de Tarefas
            </span>
            <span className="block text-xs text-slate-500">
              Next.js 15 • tRPC • Em Memória
            </span>
          </div>
        </Link>

        <nav aria-label="Navegação principal" className="flex items-center gap-2">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isHome
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ListTodo className="h-4 w-4" />
            <span>Tarefas</span>
          </Link>

          <Link
            href="/tarefas/nova"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              isNew
                ? "bg-indigo-700 text-white shadow-sm"
                : "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Nova Tarefa</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
