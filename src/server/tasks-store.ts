import { TRPCError } from "@trpc/server";

/**
 * Modelo principal de uma tarefa no sistema.
 * `dataCriacao` é armazenado como timestamp Unix em milissegundos (`Date.now()`).
 */
export interface Task {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: number;
}

export interface CreateTaskInput {
  titulo: string;
  descricao?: string;
}

export interface UpdateTaskInput {
  id: string;
  titulo: string;
  descricao?: string;
}

export interface ListTasksInput {
  cursor?: number;
  limit?: number;
}

export interface ListTasksOutput {
  items: Task[];
  nextCursor: number | undefined;
  total: number;
}

/**
 * Tarefas iniciais para demonstrar SSR e Infinite Scroll logo no primeiro carregamento.
 * Os timestamps são escalonados para garantir ordenação determinística (mais recentes primeiro).
 */
function createInitialTasks(now = Date.now()): Task[] {
  const seedData: Array<{ titulo: string; descricao?: string }> = [
    {
      titulo: "Tarefa 1",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {
      titulo: "Tarefa 2",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {
      titulo: "Tarefa 3",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {
      titulo: "Tarefa 4",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {
      titulo: "Tarefa 5",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {titulo: "Tarefa 6",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {
      titulo: "Tarefa 7",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {
      titulo: "Tarefa 8",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {
      titulo: "Tarefa 9",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {
      titulo: "Tarefa 10",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {
      titulo: "Tarefa 11",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {
      titulo: "Tarefa 12",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {
      titulo: "Tarefa 13",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {
      titulo: "Tarefa 14",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {
      titulo: "Tarefa 15",
      descricao:
        "Mostrar a scrollagem infinita.",
    },
    {
      titulo: "Tarefa 16",
      descricao:
        "Mostrar a scrollagem infinita.",
    },

  ];

  return seedData.map((item, index) => ({
    id: `seed-task-${String(index + 1).padStart(2, "0")}`,
    titulo: item.titulo,
    descricao: item.descricao,
    // Intervalos de 15 minutos entre cada tarefa seed para ordenação estável
    dataCriacao: now - index * 15 * 60 * 1000,
  }));
}

/**
 * Repositório em memória para gerenciamento de tarefas.
 * Centraliza regras de negócio, ordenação, paginação e erros de domínio.
 */
export class InMemoryTaskStore {
  private tasks: Task[];

  constructor(initialTasks: Task[] = createInitialTasks()) {
    this.tasks = [...initialTasks];
  }

  /**
   * Lista tarefas ordenadas da mais recente para a mais antiga, com paginação por offset.
   */
  list(input?: ListTasksInput): ListTasksOutput {
    const cursor = input?.cursor ?? 0;
    const limit = input?.limit ?? 8;

    const sorted = [...this.tasks].sort((a, b) => {
      if (b.dataCriacao !== a.dataCriacao) {
        return b.dataCriacao - a.dataCriacao;
      }
      return b.id.localeCompare(a.id);
    });

    const items = sorted.slice(cursor, cursor + limit);
    const nextOffset = cursor + items.length;
    const nextCursor = nextOffset < sorted.length ? nextOffset : undefined;

    return {
      items,
      nextCursor,
      total: sorted.length,
    };
  }

  /**
   * Busca uma tarefa pelo ID ou lança TRPCError NOT_FOUND caso não exista.
   */
  getById(id: string): Task {
    const task = this.tasks.find((item) => item.id === id);
    if (!task) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Tarefa com ID "${id}" não encontrada.`,
      });
    }
    return task;
  }

  /**
   * Cria uma nova tarefa validando o título e gerando ID único e timestamp automaticamente.
   */
  create(input: CreateTaskInput): Task {
    const titulo = input.titulo.trim();
    if (!titulo) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "O título da tarefa é obrigatório.",
      });
    }

    const descricaoNormalizada = input.descricao?.trim();
    const novaTarefa: Task = {
      id: crypto.randomUUID(),
      titulo,
      descricao: descricaoNormalizada ? descricaoNormalizada : undefined,
      dataCriacao: Date.now(),
    };

    // Garante timestamp estritamente maior caso duas criações ocorram no mesmo milissegundo
    const latestTimestamp = this.tasks.reduce(
      (max, item) => Math.max(max, item.dataCriacao),
      0,
    );
    if (novaTarefa.dataCriacao <= latestTimestamp) {
      novaTarefa.dataCriacao = latestTimestamp + 1;
    }

    this.tasks.unshift(novaTarefa);
    return novaTarefa;
  }

  /**
   * Atualiza uma tarefa existente pelo ID. Lança NOT_FOUND se não existir.
   */
  update(input: UpdateTaskInput): Task {
    const index = this.tasks.findIndex((item) => item.id === input.id);
    if (index === -1) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Não foi possível atualizar: tarefa "${input.id}" não encontrada.`,
      });
    }

    const titulo = input.titulo.trim();
    if (!titulo) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "O título da tarefa é obrigatório.",
      });
    }

    const descricaoNormalizada = input.descricao?.trim();
    const updatedTask: Task = {
      ...this.tasks[index],
      titulo,
      descricao: descricaoNormalizada ? descricaoNormalizada : undefined,
    };

    this.tasks[index] = updatedTask;
    return updatedTask;
  }

  /**
   * Remove uma tarefa existente pelo ID. Lança NOT_FOUND se não existir.
   */
  delete(id: string): { id: string; deleted: true } {
    const index = this.tasks.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Não foi possível excluir: tarefa "${id}" não encontrada.`,
      });
    }

    this.tasks.splice(index, 1);
    return { id, deleted: true };
  }

  /**
   * Reinicia o estado em memória (útil para testes automatizados).
   */
  reset(tasks: Task[] = createInitialTasks()): void {
    this.tasks = [...tasks];
  }
}

/**
 * Decisão arquitetural:
 * No Next.js App Router (especialmente em dev mode com HMR e múltiplos chunks),
 * Server Components e Route Handlers podem avaliar módulos em contextos isolados.
 * Ancorar o repositório em `globalThis` garante que o estado em memória seja
 * compartilhado de forma consistente entre SSR (`page.tsx`) e API (`/api/trpc/[trpc]`).
 */
const globalForTasks = globalThis as unknown as {
  __desafioArtefactTaskStore?: InMemoryTaskStore;
};

export const taskStore: InMemoryTaskStore =
  globalForTasks.__desafioArtefactTaskStore ?? new InMemoryTaskStore();

if (!globalForTasks.__desafioArtefactTaskStore) {
  globalForTasks.__desafioArtefactTaskStore = taskStore;
}
