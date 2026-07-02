## Objetivo

Introduzir uma nova entidade **Compromisso (Event)** que centraliza toda a agenda do sistema, integrando-se com Clientes, Projetos, Tarefas, Anotações, Notificações e Dashboard. A seção "Próximas" do Dashboard será substituída por "Próximos Compromissos".

## 1. Backend (Lovable Cloud / Supabase)

Nova tabela `public.events` via migration:

| Campo | Tipo |
|---|---|
| id | uuid PK |
| user_id | uuid → auth.users |
| title | text |
| description | text |
| date | date |
| start_time | time |
| end_time | time |
| category | text (`reuniao`, `chamada`, `entrega`, `prazo`, `evento`, `foco`, `pessoal`, `outro`) |
| priority | text (`low`/`medium`/`high`) |
| color | text |
| location | text |
| meeting_link | text |
| client_id | uuid → freelancer_clients |
| project_id | uuid → projects |
| task_id | uuid → tasks |
| note_id | uuid → notes |
| reminders | jsonb (array de `"1d"`, `"1h"`, `"15m"`) |
| created_at / updated_at | timestamptz |

- GRANTs para `authenticated` + `service_role`.
- RLS: política `auth.uid() = user_id` (FOR ALL).
- Trigger `touch_updated_at`.
- Índices em (`user_id`, `date`) e nas FKs.

## 2. Store (`src/lib/store.ts` + `src/lib/types.ts`)

- Tipo `EventItem` + `EventCategory` + metadados (`EVENT_CATEGORY_META` com label/cor/ícone).
- Estado `events: EventItem[]`, carregado em `loadAll`, com CRUD: `addEvent`, `updateEvent`, `deleteEvent`.
- Helper `upcomingEvents(events, limit)` ordenado por data+hora.
- Ao deletar cliente/projeto/tarefa/anotação: desvincular eventos relacionados (set null local + cascade nulo no banco via `ON DELETE SET NULL`).

## 3. UI — novos componentes

- `src/components/EventModal.tsx` — modal completo (criar/editar/excluir) com todos os campos, selects de cliente/projeto/tarefa/anotação, picker de cor, categoria, prioridade, lembretes, link da reunião.
- `src/components/dashboard/UpcomingEvents.tsx` — substitui a seção "Próximas" no `src/routes/index.tsx`. Lista cronológica com data/hora/título/cliente/projeto/badge de categoria. Clique abre `EventModal` em modo edição.

## 4. Páginas alteradas

- **`src/routes/index.tsx`** — trocar bloco "Próximas" por `<UpcomingEvents />`, com botão "Novo compromisso".
- **`src/routes/calendar.tsx`** — exibir tarefas + eventos no mesmo grid; botão "Novo compromisso" abre `EventModal`; clique em evento abre modal.
- **`src/routes/clients.tsx`** — no painel/aba do cliente, adicionar seção/aba **Compromissos** listando eventos com `client_id` desse cliente.
- **`src/routes/projects.tsx`** — no painel do projeto, adicionar abas **Cronograma** (eventos em ordem) e **Compromissos**.
- **`src/routes/tasks.tsx`** — em cada tarefa, botão **Agendar** que abre `EventModal` pré-preenchendo `title`, `task_id`, `client_id`, `project_id`.
- **`src/routes/notes.tsx`** / `NoteModal.tsx` — botão **Agendar compromisso** que abre `EventModal` com `note_id` e título da nota.

## 5. Notificações

Estender `NotificationsBell` para gerar lembretes baseados em `reminders` do evento (client-side, comparando `Date.now()` com data/hora do evento − offset). Integrar na tabela `notifications` existente (reutilizar fluxo atual).

## 6. Visual

- Mantém design escuro premium atual: `glass-card`, bordas suaves, paleta `electric/neon/orange-accent`.
- Categorias com cores OKLCH no mesmo estilo de `CATEGORY_META`.
- Sidebar, identidade visual e rotas existentes intocadas.

## 7. Entregáveis

Migração SQL → tipos regenerados → store estendida → componentes novos → integrações nas 6 páginas. Sem remover funcionalidades atuais. Compatível com build Lovable e Vercel (sem mudanças em `vite.config.ts` / `vercel.json`).

## Confirmar antes de implementar

Esta é uma feature grande (~10 arquivos novos/alterados + migration). Posso seguir com a implementação completa, ou prefere que eu faça em etapas (ex.: 1º migração+store+modal+Dashboard; depois integrações por página)?
