import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { InMemoryTaskStore } from "@/server/tasks-store";
import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

function createTestCaller(initialTasks = [] as ConstructorParameters<typeof InMemoryTaskStore>[0]) {
  const store = new InMemoryTaskStore(initialTasks);
  const factory = createCallerFactory(appRouter);
  return factory(() => createTRPCContext(store));
}

describe("taskRouter (tRPC CRUD em memória)", () => {
  it("cria uma tarefa com id único, timestamp e descrição opcional", async () => {
    const caller = createTestCaller([]);

    const created = await caller.task.create({
      titulo: "  Estudar Next.js 15  ",
      descricao: "  Revisar App Router e Server Components  ",
    });

    expect(created.id).toBeTruthy();
    expect(created.titulo).toBe("Estudar Next.js 15");
    expect(created.descricao).toBe("Revisar App Router e Server Components");
    expect(typeof created.dataCriacao).toBe("number");
    expect(created.dataCriacao).toBeGreaterThan(0);

    const withoutDesc = await caller.task.create({
      titulo: "Tarefa sem descrição",
      descricao: "   ",
    });

    expect(withoutDesc.id).not.toBe(created.id);
    expect(withoutDesc.descricao).toBeUndefined();
  });

  it("impede criação de tarefa sem título ou apenas com espaços", async () => {
    const caller = createTestCaller([]);

    await expect(
      caller.task.create({ titulo: "" }),
    ).rejects.toThrow();

    await expect(
      caller.task.create({ titulo: "    " }),
    ).rejects.toThrow();
  });

  it("lista tarefas ordenadas da mais recente para a mais antiga com paginação por cursor", async () => {
    const caller = createTestCaller([
      { id: "1", titulo: "Antiga", dataCriacao: 1000 },
      { id: "2", titulo: "Média", dataCriacao: 2000 },
      { id: "3", titulo: "Recente", dataCriacao: 3000 },
    ]);

    const page1 = await caller.task.list({ cursor: 0, limit: 2 });
    expect(page1.total).toBe(3);
    expect(page1.items.map((t) => t.id)).toEqual(["3", "2"]);
    expect(page1.nextCursor).toBe(2);

    const page2 = await caller.task.list({ cursor: page1.nextCursor, limit: 2 });
    expect(page2.items.map((t) => t.id)).toEqual(["1"]);
    expect(page2.nextCursor).toBeUndefined();
  });

  it("atualiza uma tarefa existente e falha com NOT_FOUND quando inexistente", async () => {
    const caller = createTestCaller([]);
    const created = await caller.task.create({
      titulo: "Título original",
      descricao: "Descrição original",
    });

    const updated = await caller.task.update({
      id: created.id,
      titulo: "Título atualizado",
      descricao: "Nova descrição",
    });

    expect(updated.id).toBe(created.id);
    expect(updated.titulo).toBe("Título atualizado");
    expect(updated.descricao).toBe("Nova descrição");
    expect(updated.dataCriacao).toBe(created.dataCriacao);

    await expect(
      caller.task.update({
        id: "id-inexistente",
        titulo: "Qualquer",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    } satisfies Partial<TRPCError>);
  });

  it("deleta uma tarefa existente e retorna NOT_FOUND ao tentar deletar inexistente", async () => {
    const caller = createTestCaller([]);
    const created = await caller.task.create({
      titulo: "Tarefa temporária",
    });

    const deleted = await caller.task.delete({ id: created.id });
    expect(deleted).toEqual({ id: created.id, deleted: true });

    await expect(
      caller.task.byId({ id: created.id }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    await expect(
      caller.task.delete({ id: created.id }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
