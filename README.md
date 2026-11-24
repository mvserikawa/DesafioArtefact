# Gerenciador de Tarefas — Next.js 15 + tRPC

Aplicação web de gerenciamento de tarefas construída com **Next.js 15 (App Router)**, **React 19**, **tRPC v11**, **TanStack React Query v5**, **Zod** e **Tailwind CSS v4**, com armazenamento em memória no backend.

## Funcionalidades Implementadas

- **Backend tRPC em memória (`/api/trpc/[trpc]`)**:
  - Modelagem da tarefa com `id` (UUID gerado automaticamente), `titulo` (obrigatório), `descricao` (opcional) e `dataCriacao` (timestamp Unix em milissegundos).
  - Operações CRUD completas: `task.list` (paginado por cursor), `task.byId`, `task.create`, `task.update` e `task.delete`.
  - Validação com **Zod** (impede tarefas sem título ou com apenas espaços) e erros semânticos com `TRPCError` (ex.: `NOT_FOUND` para IDs inexistentes).
- **Listagem de Tarefas com SSR + Infinite Scroll (`/`)**:
  - Pré-carregamento da primeira página no servidor (**Server-Side Rendering**) via `prefetchInfiniteQuery` e `HydrationBoundary`, garantindo HTML já populado na resposta inicial.
  - Carregamento incremental (**Infinite Scroll**) usando `IntersectionObserver` + `useInfiniteQuery` (além de botão manual alternativo "Carregar mais tarefas").
  - Exclusão direta na listagem com indicador de carregamento por item e feedback visual de sucesso/erro (alerta inline + toast).
- **Criação e Edição de Tarefas (`/tarefas/nova` e `/tarefas/[id]/editar`)**:
  - Formulário funcional com React hooks (`useState`, `useRef`, `useMutation`), validação no cliente e tratamento estruturado de erros vindos do backend.
  - Tratamento amigável na rota de edição caso o `id` informado não exista.

## Principais Decisões Técnicas

1. **Armazenamento em memória compartilhado via `globalThis` (`src/server/tasks-store.ts`)**:
   No Next.js App Router (especialmente em desenvolvimento com HMR e bundles separados), Server Components e Route Handlers podem avaliar módulos em contextos distintos. Ancorar a instância `InMemoryTaskStore` em `globalThis` garante que SSR e endpoints `/api/trpc` compartilhem exatamente o mesmo estado em memória.
2. **Dados iniciais (seed)**:
   O repositório inicia com 18 tarefas de exemplo para que tanto o SSR quanto o Infinite Scroll (páginas de 8 itens) possam ser testados imediatamente após subir o servidor.
3. **Validação compartilhada (`src/lib/task-validation.ts`)**:
   Os mesmos schemas Zod são reutilizados nas procedures tRPC e na validação do formulário no frontend, evitando divergência de regras e mensagens.
4. **SSR sem flash de carregamento (`src/app/page.tsx` + `src/trpc/server.tsx`)**:
   A página inicial utiliza `export const dynamic = "force-dynamic"` e aguarda `prefetchInfiniteQuery` antes de renderizar `<HydrateClient>`, evitando cache estático desatualizado e garantindo hidratação imediata do `useInfiniteQuery`.

## Estrutura do Projeto

```text
src/
├── app/
│   ├── api/trpc/[trpc]/route.ts   # Adapter HTTP do tRPC (GET/POST)
│   ├── tarefas/
│   │   ├── nova/page.tsx          # Página de criação de tarefa
│   │   └── [id]/editar/page.tsx   # Página SSR de edição de tarefa
│   ├── globals.css
│   ├── layout.tsx                 # Layout raiz com TRPCReactProvider e ToastProvider
│   └── page.tsx                   # Listagem inicial com SSR
├── components/
│   ├── Navbar.tsx                 # Barra de navegação
│   ├── TaskForm.tsx               # Formulário reutilizável (criar/editar)
│   ├── TaskList.tsx               # Listagem com Infinite Scroll e exclusão
│   └── ToastProvider.tsx          # Sistema de notificações visuais
├── lib/
│   ├── date-format.ts             # Formatação consistente de dataCriacao
│   └── task-validation.ts         # Schemas Zod compartilhados
├── server/
│   └── tasks-store.ts             # Repositório em memória (CRUD + paginação)
└── trpc/
    ├── __tests__/task.router.test.ts # Testes unitários das procedures tRPC
    ├── client.tsx                 # Provider tRPC + React Query no cliente
    ├── init.ts                    # Contexto, Superjson e errorFormatter
    ├── query-client.ts            # Fábrica do QueryClient com Superjson
    ├── routers/
    │   ├── _app.ts                # AppRouter raiz e tipo AppRouter
    │   └── task.ts                # Router de tarefas
    └── server.tsx                 # Proxy e caller tRPC para Server Components
```

## Como Executar

1. Instale as dependências:

```bash
npm install
```

2. Execute em modo de desenvolvimento:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

3. Outros comandos úteis:

```bash
# Executar testes unitários do backend tRPC
npm test

# Verificar lint
npm run lint

# Gerar build de produção e iniciar
npm run build
npm start
```
