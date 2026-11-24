import { TaskList } from "@/components/TaskList";
import { DEFAULT_TASKS_PAGE_SIZE } from "@/lib/task-validation";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

// Garante renderização SSR a cada requisição para refletir o estado atual em memória
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const queryClient = getQueryClient();

  // Pré-carrega a primeira página no servidor (SSR) antes de hidratar o cliente
  await queryClient.prefetchInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(
      { limit: DEFAULT_TASKS_PAGE_SIZE },
      {
        initialCursor: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  );

  return (
    <HydrateClient>
      <TaskList />
    </HydrateClient>
  );
}
