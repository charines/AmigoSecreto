# Plano: Novos templates de e-mail (HTML + tom divertido)

> Documento de planejamento. Depois da implementação, revisar/mesclar o conteúdo relevante no módulo de domínio correspondente (`orquestrador_grupo.md` / `juiz_sorteio.md` / `portaria_auth.md`) e remover este arquivo ou arquivá-lo.

# Contexto

Os e-mails do AmigoSecreto hoje usam um tema "Dharma/Lost" (sobrevivente do dia a dia, protocolo, Namaste) escrito como primeira versão de brincadeira interna, e são enviados só como `text/plain` via nodemailer. O sistema evoluiu e o usuário quer abandonar essa referência e modernizar os e-mails: tom divertido e caloroso (sem referenciar nenhuma série/filme), migrando para HTML com botão de call-to-action (mantendo texto puro como fallback), preservando o nome "Amigo Secreto".

Existem hoje 4 pontos de conteúdo de e-mail, todos texto puro, nenhum com layout HTML reutilizável:
1. Convite de participação (`backend/lib/inviteEmail.ts`), usado por `groups_join.ts`, `groups_invite.ts`, `participants_resend_invite.ts`.
2. Resultado do sorteio, montado inline em `backend/api/groups_draw.ts:88-110`.
3. Reenvio de chave de acesso do sorteio, duplicado quase igual em `backend/lib/handlers/participants_resend_draw.ts:63-84`.
4. Recuperação de senha do admin, inline em `backend/lib/handlers/admin_forgot_password.ts:46-58`.

`backend/lib/mailer.ts` usa nodemailer e hoje só suporta `{ to, subject, text }` — sem campo `html`.

# Objetivo

Migrar os 4 fluxos de e-mail de texto puro com tema "Dharma/Lost" para HTML + texto (multipart), com tom divertido/caloroso genérico, mantendo "Amigo Secreto" como marca.

## A) `backend/lib/mailer.ts`
- Estender `MailMessage`: `{ to: string; subject: string; text: string; html?: string }`.
- Em `createSendMail`, passar `html: message.html` para `transport.sendMail({...})`. Campo opcional, não quebra `send-test-email.ts` nem outros callers existentes.

## B) `backend/lib/emailLayout.ts` (novo)
Helper puro, sem I/O, que gera o wrapper HTML comum:
```ts
export type EmailLayoutInput = {
  previewText?: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};
export function renderEmailLayout(input: EmailLayoutInput): string { ... }
```
- `<table role="presentation">` largura ~560px, fundo `#fbf8ff`, cartão com borda sólida `2px solid #181a2e` (nada de `box-shadow`/`border-radius` avançado — Outlook não suporta de forma confiável).
- Header: faixa `background-color:#b7102a`, texto branco, emoji + "Amigo Secreto".
- CTA: padrão clássico de e-mail — tabela com célula `background-color:#b7102a; border-radius:8px`, link branco em negrito dentro, não CSS em `<a>` isolado.
- Cores: primary `#b7102a`, texto `#181a2e` sobre fundo `#fbf8ff`, accent opcional `#ffb702` para badges/destaques.
- Tudo em estilos inline (sem `<style>` de bloco). Função testável sem mocks.

## C) Conteúdo dos 4 templates (novo tom)

### C1. `backend/lib/inviteEmail.ts`
- Retorno ganha `html`: `{ subject: string; text: string; html: string }`.
- Subject: `🎁 Você foi convidado para o Amigo Secreto "${groupTitle}"!` (+ `(Reenvio)` quando `resend`).
- Texto (tom): convite caloroso/divertido, menciona `groupDescription`, CTA para `inviteLink`.
- HTML via `renderEmailLayout`, heading "🎁 Você foi convidado!", CTA "Confirmar participação".

### C2. Resultado do sorteio — novo módulo `backend/lib/drawResultEmail.ts`
Extrair a lógica duplicada entre `groups_draw.ts` e `participants_resend_draw.ts` (já que ambos serão tocados):
```ts
export type DrawResultEmailInput = {
  groupTitle: string;
  groupDescription: string;
  drawDate: string | null;
  revealLink: string;
  accessCode: string;
  resend: boolean;
};
export type DrawResultEmail = { subject: string; text: string; html: string };
export function buildDrawResultEmail(input: DrawResultEmailInput): DrawResultEmail { ... }
```
- Subject: `🔑 O sorteio saiu! Veja quem você tirou no "${groupTitle}"` (+ `(Reenvio)`).
- HTML: heading "🥳 O sorteio saiu!", CTA "Revelar meu amigo secreto" → `revealLink`, código de acesso em destaque (badge/monospace).

### C3. `backend/api/groups_draw.ts`
- Remover montagem inline (linhas ~88-110); usar `buildDrawResultEmail({ groupTitle: group.title, groupDescription: group.description, drawDate: group.draw_date, revealLink, accessCode: r.token, resend: false })`.
- `sendMail({ to: r.email, subject: email.subject, text: email.text, html: email.html })`.

### C4. `backend/lib/handlers/participants_resend_draw.ts`
- Mesma extração, `resend: true`. Atualizar chamada de `sendMail` para incluir `html`.

### C5. `backend/lib/handlers/admin_forgot_password.ts`
- Tom neutro-caloroso (reset de senha), mesmo layout de marca.
- Subject: `🔒 Redefinição de senha — Amigo Secreto`.
- Montar `html` inline com `renderEmailLayout` (só 1 callsite, não precisa de módulo próprio). Heading "🔒 Redefinir senha", CTA "Criar nova senha" → `resetLink`.
- Passar `html` no objeto enviado para `send(...)`.

## D) Callsites a atualizar para passar `html`
- `backend/lib/handlers/groups_join.ts` (~linha 68-70): incluir `html: mail.html`.
- `backend/lib/handlers/groups_invite.ts` (loop, ~linha 75-79): incluir `html: email.html`.
- `backend/lib/handlers/participants_resend_invite.ts` (~linha 60-63): incluir `html: email.html`.
- `backend/api/groups_draw.ts` e `backend/lib/handlers/participants_resend_draw.ts`: cobertos em C3/C4.
- `backend/lib/handlers/admin_forgot_password.ts`: coberto em C5.

`backend/scripts/send-test-email.ts` não precisa mudar (campo `html` é opcional).

## E) Testes
- Atualizar `backend/lib/inviteEmail.test.ts`: validar `email.html` existe e contém `href` com `inviteLink`; remover/ajustar asserções que dependiam de frases do tema antigo (ex. "Testando data e hora do sistema.", "Namaste").
- Atualizar `backend/lib/handlers/participants_resend_invite.test.ts`: manter checagem de `(Reenvio)` no subject; opcionalmente checar presença de `message.html`.
- Novo `backend/lib/drawResultEmail.test.ts`: subject com/sem `(Reenvio)`, `text`/`html` contendo `revealLink` e `accessCode`, fallback de `groupDescription`/`drawDate` ausentes.
- Novo `backend/lib/emailLayout.test.ts`: garante `heading`/`bodyHtml` presentes, CTA só aparece com `ctaUrl`+`ctaLabel`, URL do CTA em atributo `href`.
- Checar se já existem `groups_draw.test.ts`, `participants_resend_draw.test.ts`, `admin_forgot_password.test.ts` antes de criar — se existirem, ajustar ao invés de duplicar.

## Riscos
- Outlook desktop não suporta `box-shadow`, `border-radius` parcial, flex/grid, nem `<style>` de bloco confiável — por isso layout em tabelas + inline, sem tentar replicar o visual neo-brutalista do frontend.
- Manter `text` sempre em sincronia de conteúdo com o `html` (fallback obrigatório, não cosmético).
- Emojis no subject: usar 1-2 no máximo para não acionar filtros de spam.
- Evitar imagem remota de logo — usar emoji como "logo" (sempre renderiza).
- Nenhuma env var nova necessária; `mailConfig.from`/`fromName` inalterados.
- Links (`inviteLink`/`revealLink`/`resetLink`) já são absolutos — manter assim para o CTA funcionar em qualquer cliente.

## Verificação local
1. `cd backend && npx vitest run` — `inviteEmail.test.ts`, `participants_resend_invite.test.ts`, `drawResultEmail.test.ts`, `emailLayout.test.ts` passando.
2. `npx tsc --noEmit` para validar tipos (`MailMessage.html`, novos módulos).
3. Teste manual via `tsx backend/scripts/send-test-email.ts seu-email@exemplo.com "Teste" "corpo"` (confirma text-only ainda funciona).
4. Validar renderização do HTML (Mailtrap/Ethereal ou similar) em Gmail web, Outlook desktop, e um cliente mobile — CTA clicável, cores legíveis, texto não cortado.
5. Rodar fluxo end-to-end local (join → convite; sorteio → resultado; reenvio de chave; esqueci senha) e confirmar respostas `200` e chegada de `html`+`text`.

## Arquivos críticos
- `backend/lib/mailer.ts`
- `backend/lib/emailLayout.ts` (novo)
- `backend/lib/inviteEmail.ts`
- `backend/lib/drawResultEmail.ts` (novo)
- `backend/api/groups_draw.ts`
- `backend/lib/handlers/participants_resend_draw.ts`
- `backend/lib/handlers/admin_forgot_password.ts`
- `backend/lib/handlers/groups_join.ts`
- `backend/lib/handlers/groups_invite.ts`
- `backend/lib/handlers/participants_resend_invite.ts`
- `backend/lib/inviteEmail.test.ts`
- `backend/lib/handlers/participants_resend_invite.test.ts`
