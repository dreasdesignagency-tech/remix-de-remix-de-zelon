# Deploy na Vercel (compatível com Lovable)

Este projeto está configurado para rodar nativamente em **dois ambientes** sem qualquer edição manual:

- **Lovable** (Cloudflare Workers) — quando você publica pelo botão Publish do Lovable.
- **Vercel** (Serverless Functions + Static) — quando você faz deploy pela Vercel via GitHub ou CLI.

A detecção é automática via a variável de ambiente `VERCEL` (definida pela própria Vercel durante o build).

---

## Como funciona

`vite.config.ts` lê `process.env.VERCEL`:

| Ambiente | Preset Nitro | Output |
|---|---|---|
| Lovable / local | `cloudflare-module` (padrão Lovable) | `dist/` |
| Vercel (`VERCEL=1`) | `vercel` | `.vercel/output/` |

O TanStack Start é compilado pelo Nitro com o preset correto, então **SSR, Server Functions, autenticação Supabase e todas as rotas funcionam normalmente nos dois lados**.

---

## Passo a passo — Deploy via GitHub (recomendado)

### 1. Conectar Lovable ↔ GitHub
No Lovable, abra o menu **+** (canto inferior esquerdo do chat) → **GitHub** → **Connect project** → **Create Repository**.

A partir daqui, todas as edições no Lovable são automaticamente enviadas para o GitHub.

### 2. Importar o repositório na Vercel
1. Acesse https://vercel.com/new
2. Selecione o repositório criado
3. **Framework Preset**: deixe como `Other` (o `vercel.json` já define tudo)
4. Não altere `Build Command` nem `Output Directory` — o `vercel.json` faz isso

### 3. Configurar variáveis de ambiente na Vercel
Em **Project Settings → Environment Variables**, adicione (para `Production`, `Preview` e `Development`):

```
VITE_SUPABASE_URL              = https://jwrrtjmrylzmuqpxzauj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY  = (a chave anon do .env)
VITE_SUPABASE_PROJECT_ID       = jwrrtjmrylzmuqpxzauj
SUPABASE_URL                   = https://jwrrtjmrylzmuqpxzauj.supabase.co
SUPABASE_PUBLISHABLE_KEY       = (mesma chave anon)
SUPABASE_PROJECT_ID            = jwrrtjmrylzmuqpxzauj
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` **não é necessária** para o app — todas as operações usam a chave anon + RLS. Se algum dia você usar `supabaseAdmin`, adicione essa secret também (não está disponível no Lovable Cloud; obtenha-a apenas se você gerenciar o Supabase diretamente).

### 4. Deploy
Clique em **Deploy**. A cada push no GitHub (vindo do Lovable ou local), a Vercel faz deploy automático.

---

## Alternativa: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel            # primeiro deploy (preview)
vercel --prod     # deploy de produção
```

A CLI lê o `vercel.json` automaticamente e configura tudo.

---

## Rotas suportadas (todas funcionam em ambos os ambientes)

- `/` — Dashboard
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/tasks`
- `/projects`
- `/clients`
- `/calendar`
- `/notes`
- `/profile`

Todas com SSR + autenticação Supabase + RLS preservados.

---

## Arquivos relevantes

| Arquivo | Função |
|---|---|
| `vite.config.ts` | Detecta `VERCEL=1` e aplica o preset Nitro correto |
| `vercel.json` | Build command, output directory e rewrites para a Vercel |
| `wrangler.jsonc` | Configuração Cloudflare Workers (usada apenas no Lovable) |
| `src/server.ts` | SSR error wrapper — usado apenas no preset Cloudflare |

---

## Troubleshooting

**Build falha na Vercel com "nitro not found"**
O `nitro` já está em `dependencies` no `package.json`. Se persistir, force `Install Command` = `npm install`.

**404 em refresh de rotas profundas**
O `vercel.json` já contém o rewrite catch-all (`/:path*` → `/`). Não remova.

**Autenticação não funciona em produção**
Verifique se as variáveis `VITE_SUPABASE_*` estão definidas em **Production** nas Environment Variables da Vercel.

**Quero atualizar o app**
Edite no Lovable normalmente. O Lovable faz push para o GitHub → Vercel faz deploy automático. Você não precisa tocar em nada.
