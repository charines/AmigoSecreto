# Plano: Login de participante + visão readonly do grupo

> Status: planejado, implementação ainda não iniciada.

## Contexto

Hoje só quem está logado como `admin` (dono do grupo, `groups.admin_id`) acessa o
`AdminDashboard.jsx` — tela de gerenciamento com STATUS/DATA/ORÇAMENTO/DHARMA CODE, lista de
participantes e CTAs (adicionar, reenviar convite/sorteio, remover, executar sorteio).
Participantes (as pessoas sorteadas) hoje só interagem via links tokenizados (`/invite`,
`/reveal`, `/join`, `/chat`) e nunca veem essa tela.

O pedido é dar aos participantes uma forma de **acompanhar** o(s) grupo(s) em que estão, em modo
leitura — sem os CTAs de gerenciamento, que continuam exclusivos do admin/dono.

Decisões já validadas com o usuário:
- Login próprio do participante, **email + senha** (não reaproveita token/link como sessão).
- A senha é criada **a partir do link de convite** (`InvitePage.jsx`), depois de confirmar
  participação — não é uma tela de cadastro livre.
- Uma conta (email) dá acesso a **todos os grupos** em que a pessoa foi convidada com aquele
  email — não é por grupo isolado.
- A tela readonly é **a mesma tela do admin** (status, data, orçamento, dharma code, contadores,
  lista de participantes), só que sem nenhum CTA (sem adicionar, reenviar, remover, executar
  sorteio).

## Estado atual relevante (fonte de verdade, levantado nesta sessão)

### Auth do admin (modelo a espelhar)

- Dispatch por `?action=`: `backend/api/admin.ts:38-94` (`login`, `register`, `logout`, `me`,
  `forgot_password`, `reset_password`).
- Login: `backend/lib/handlers/admin_login.ts` — função pura `loginAdmin(pool, input)` + handler
  HTTP default export.
- Hash de senha: `backend/lib/password.ts` — bcryptjs, custo 10, com normalização de prefixo
  `$2y$` → `$2b$` (compat com hash legado do PHP).
- Sessão: `backend/lib/session.ts` (`randomToken`, `buildSessionCookieOptions`) +
  `backend/lib/sessionStore.ts` (`createSession`, `resolveSession`, `destroySession` — guarda
  SHA-256 do token em `sessions.token_hash`, TTL 7 dias).
- Cookie: `session=<token>`, HttpOnly, SameSite/secure vindos de `config.session`
  (`backend/lib/config.ts:17,53-55`).
- Leitura do cookie: `backend/lib/requestSession.ts` (`readSessionToken`, parseia header
  `Cookie`, procura prefixo `session=`).
- Guard de rota protegida: `backend/lib/requireAdmin.ts` — resolve sessão e busca o admin.
- Frontend: `AdminAuth.jsx` posta pra `/api/admin?action=login|register` via `apiPost`
  (`frontend/src/lib/api.js`, `fetch` com `credentials: 'include'` — cookie viaja sozinho, sem
  localStorage). `App.jsx:63-77` faz `?action=me` pra rehidratar sessão ao montar.

### Tabelas existentes

- `admins` (`backend/db/schema.sql:27-36` + índice único de email): `id, name, email,
  password_hash, created_at` (+ `reset_token_hash`, `reset_expires` da migração v5).
- `sessions` (`backend/db/sessions.sql`): `id, token_hash (unique), admin_id, expires_at,
  created_at`, FK `admin_id → admins.id ON DELETE CASCADE`.
- `participants` (`backend/db/schema.sql:94-108`): `id, group_id, name, email, status (enum:
  invited/link_clicked/confirmed/token_sent/revealed), invite_token, reveal_token,
  invite_sent_at, invite_clicked_at, confirmed_at, token_sent_at, revealed_at, created_at`.
  **Já tem `email`, mas não é único** — o mesmo email pode aparecer em várias linhas/grupos. Sem
  coluna de senha.
- `groups` (`backend/db/schema.sql:76-86`): `id, admin_id, title, description, draw_date,
  budget_limit, status (enum: open/drawn/cancelled), dharma_code (unique), created_at`.

### Convenção de handler (exemplo `groups_detail.ts`)

Função pura exportada (`getGroupDetail(pool, adminId, groupId)` → `{status, body}`, testável
isoladamente — ver `groups_detail.test.ts`) + `export default async function handler(req, res)`
fazendo a parte HTTP (CORS, pool, guard de auth, parse de query, chama a função pura, escreve
status+JSON). O arquivo em `backend/api/groups.ts` despacha `?action=detail` pra esse handler, no
mesmo molde de `admin.ts` → `admin_login.ts` etc.

### Fluxo de convite (onde a criação de senha vai se encaixar)

- `backend/api/invite.ts` — `GET` chama `getInvite` (busca participante por `invite_token`,
  marca `link_clicked`); `POST` chama `confirmInvite`
  (`backend/lib/handlers/invite_confirm.ts`, marca `status = confirmed`).
- `frontend/src/components/InvitePage.jsx` — carrega o convite (`GET /api/invite?token=...`),
  mostra nome/email, botão "CONFIRMAR PARTICIPAÇÃO" (`handleConfirm`, linhas 28-39) que chama
  `POST /api/invite`. Após `confirmed === true` (linha 120-128) é o ponto natural para inserir o
  formulário "criar senha".

### Migrações

`backend/db/migrate.ts` roda, em sequência, `migrateV2, migrateV3, migrateV4, migrateV5,
migrateSessions`. Cada migração é idempotente (try/catch silencioso em `ALTER TABLE`) e vive em
`backend/db/migrate_vN.ts` ou, pra tabela nova, em `backend/db/<nome>.sql` + um runner
`migrate_<nome>.ts` que só faz `readFileSync` + `pool.query(sql)` (ver `migrate_sessions.ts` +
`sessions.sql`).

### Risco identificado: não reaproveitar `sessions.admin_id` para id de participante

A tabela `sessions` guarda só `admin_id` (sem `actor_type`). Reusar essa coluna para ids de
`participant_accounts` criaria ambiguidade entre dois domínios de id diferentes e quebraria
`requireAdmin.ts` (que sempre busca em `admins`). Por isso: **tabela de sessão própria para
participante**, não uma coluna extra na tabela existente.

## Modelo de dados novo

- **`participant_accounts`**: `id, email (unique), password_hash, created_at` — mesmo padrão de
  `admins`, sem `name` (o nome já vem de cada linha de `participants`).
- **`participant_sessions`**: mesma estrutura de `sessions`, mas para o domínio de participante:
  `id, token_hash (unique), participant_account_id, expires_at, created_at`, FK →
  `participant_accounts.id ON DELETE CASCADE`.
- Migração nova `backend/db/participant_accounts.sql` + `participant_sessions.sql` (schema) e
  `backend/db/migrate_participant_accounts.ts` (runner, molde de `migrate_sessions.ts`),
  registrada em `migrate.ts`.

## Backend (novos arquivos)

Mesmo padrão: função pura em `backend/lib/handlers/*.ts` + glue HTTP no mesmo arquivo, dispatch
por `?action=` em `backend/api/participant.ts` novo (molde de `backend/api/admin.ts`).

- **`participant_set_password.ts`** — recebe `invite_token` (o mesmo token que `InvitePage.jsx`
  já tem) + senha. Resolve a linha de `participants` pelo `invite_token` (igual
  `getInvite`/`confirmInvite` fazem), pega o `email` dela e faz **upsert** em
  `participant_accounts` (`INSERT ... ON DUPLICATE KEY UPDATE password_hash = ...`): cria a
  conta na primeira vez; se a pessoa já tem conta de outro grupo com o mesmo email, só atualiza a
  senha. Hash via `backend/lib/password.ts` (reaproveitado, sem duplicar).
- **`participant_login.ts`** — email + senha contra `participant_accounts`, mesma lógica de
  `admin_login.ts`; cria sessão via `participantSessionStore.ts` novo (molde de
  `sessionStore.ts`, mas sobre `participant_sessions`/`participant_account_id`).
- **`participant_logout.ts`**, **`participant_me.ts`** — espelham `admin_logout.ts` /
  `admin_me.ts`.
- **`backend/lib/requireParticipant.ts`** — espelha `requireAdmin.ts`, mas lê o cookie
  `participant_session` (nome de cookie **dedicado**, diferente de `session`, pra permitir admin
  e participante logados ao mesmo tempo no mesmo navegador) e resolve contra
  `participant_accounts`.
- **`participant_groups_list.ts`** — `SELECT g.* FROM groups g JOIN participants p ON
  p.group_id = g.id WHERE p.email = ? GROUP BY g.id` (email da conta logada).
- **`participant_group_detail.ts`** — mesma query/shape de `groups_detail.ts` (status, data,
  orçamento, dharma_code, contadores, lista de participantes), mas autorização por "existe uma
  linha em `participants` deste `group_id` com o email da conta logada" em vez de `admin_id`.

`backend/lib/requestSession.ts` ganha um `readParticipantSessionToken(req)` (mesma lógica de
`readSessionToken`, procurando o prefixo `participant_session=`).

## Frontend

- **`InvitePage.jsx`**: depois de `handleConfirm` e com `confirmed === true`, mostrar um
  formulário "Criar senha para acompanhar seus grupos" (email já vem de
  `data.participant.email`, só pede a senha) chamando
  `/api/participant?action=set_password` com `{ token, password }`. CTA "agora não" pra pular.
- **`ParticipantAuth.jsx`** (novo, estrutura copiada de `AdminAuth.jsx` mas só modo login —
  sem "criar conta", já que a conta nasce no fluxo de convite) — login com email + senha,
  `/api/participant?action=login`.
- **`GroupDetailView.jsx`** (novo, extraído de `AdminDashboard.jsx` linhas ~618-876) —
  componente de apresentação parametrizado por `readOnly`: quando `readOnly`, esconde o
  formulário "Novo Participante" (linhas 692-735), os botões "REENVIAR"/"REENVIAR
  SORTEIO"/remover por linha (762-789) e o botão sticky "EXECUTAR SORTEIO" (799-813); mantém
  card de status/data/orçamento/dharma code, contadores e lista de participantes. Usado tanto
  por `AdminDashboard` (`readOnly={false}`) quanto por `ParticipantDashboard` (`readOnly`),
  evitando duplicar a tela inteira.
- **`ParticipantDashboard.jsx`** (novo) — lista os grupos do participante (reaproveita o card de
  grupo de `AdminDashboard.jsx` `renderList`, sem botão de deletar nem "Criar um novo grupo") e,
  ao selecionar um, renderiza `GroupDetailView` em modo readonly.
- **`App.jsx`**: nova rota `/area` em `resolveRoute()` (linhas 35-43), com seu próprio
  `?action=me` contra `/api/participant` (espelhando linhas 63-77) e renderização condicional
  `ParticipantAuth` / `ParticipantDashboard` (espelhando linhas 129+).

## Verificação

- `./preflight.sh` (lint + build) depois das mudanças de backend e frontend.
- Rodar a app localmente (skill `run-amigosecreto`): criar grupo como admin, convidar um
  participante, confirmar participação no link de convite, criar senha, logar como participante
  em `/area` e confirmar que a tela mostra os dados do grupo sem nenhum CTA de gerenciamento.
- Confirmar que o admin continua vendo e usando todos os CTAs normalmente (regressão no
  `AdminDashboard`, já que `GroupDetailView` passa a ser compartilhado).
- Testar um email participando de 2 grupos diferentes: login único deve listar os 2 grupos.
