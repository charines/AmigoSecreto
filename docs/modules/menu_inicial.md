---
module: menu_inicial
domain: SA-01 (Portaria) + SA-02 (Orquestrador de Grupo)
components: [App.jsx, AdminAuth.jsx, ForgotPassword.jsx, ResetPassword.jsx, AdminDashboard.jsx, InvitePage.jsx, JoinGroup.jsx]
endpoints: [admin_me.php, admin_login.php, admin_forgot_password.php, admin_reset_password.php, invite.php, invite_confirm.php, groups_join.php]
last_updated: 2026-06-29
redesign_note: >
  2026-06-28 · Redesign Neo-Brutalist — AdminAuth, AdminDashboard e RevealPage
  passaram a ter layout próprio (full-page).
update_note: >
  2026-06-29 · Migração completa para Neo-Brutalist: InvitePage.jsx e JoinGroup.jsx
  redesenhados (full-page, sem wrapper). TerminalPanel.jsx, StepIndicator.jsx e
  RetroTyping.jsx removidos do projeto — App.jsx agora usa um componente local
  StatusScreen (Neo-Brutalist) para os estados de erro/loading sem rota dedicada.
  Sistema de troca de tema CRT (ThemeContext.jsx, themes/themes.js, `?style=`)
  removido por completo: não há mais nenhuma tela com design antigo CRT.
---

# Módulo: Menu Inicial — Fluxo de Entrada e Self-Invitation

> **Contexto de uso:** Inclua este arquivo em prompts sobre o ponto de entrada da aplicação,
> fluxo de autenticação admin, CTAs do AdminDashboard, e fluxo de convite/adesão de participante.

---

## Diagrama 1 — Roteamento e Entry Point (App.jsx)

```mermaid
flowchart TD
    START([Usuário acessa URL]) --> RESOLVE[resolveRoute\nApp.jsx]

    RESOLVE -->|path = /invite| ROUTE_INVITE[route = 'invite']
    RESOLVE -->|path = /reveal| ROUTE_REVEAL[route = 'reveal']
    RESOLVE -->|path = /join| ROUTE_JOIN[route = 'join']
    RESOLVE -->|path = /chat| ROUTE_CHAT[route = 'chat']
    RESOLVE -->|qualquer outro path| ROUTE_ADMIN[route = 'admin']

    ROUTE_ADMIN --> CHECK_ENV{VITE_API_BASE_URL\nconfigurado?}
    CHECK_ENV -->|NÃO| ERR_ENV["StatusScreen (Neo-Brutalist)\nErro: API não configurada"]
    CHECK_ENV -->|SIM| CHECK_SESSION[apiGet /admin_me.php\nverifica cookie de sessão]

    CHECK_SESSION -->|checking=true| LOADING["StatusScreen (Neo-Brutalist)\nCarregando sessão..."]
    CHECK_SESSION -->|admin presente| DASHBOARD["AdminDashboard.jsx\nlayout próprio Neo-Brutalist"]
    CHECK_SESSION -->|sem sessão| AUTH["AdminAuth.jsx\nlayout próprio Neo-Brutalist"]

    ROUTE_INVITE --> CHECK_TOKEN_I{?token=\npresente?}
    CHECK_TOKEN_I -->|SIM| INVITE_PAGE["InvitePage.jsx\nlayout próprio Neo-Brutalist"]
    CHECK_TOKEN_I -->|NÃO| ERR_TOKEN_I["StatusScreen (Neo-Brutalist)\nErro: Token de convite ausente"]

    ROUTE_REVEAL --> CHECK_TOKEN_R{?token=\npresente?}
    CHECK_TOKEN_R -->|SIM| REVEAL_PAGE["RevealPage.jsx\nlayout próprio Neo-Brutalist"]
    CHECK_TOKEN_R -->|NÃO| ERR_TOKEN_R["StatusScreen (Neo-Brutalist)\nErro: Token de revelação ausente"]

    ROUTE_JOIN --> JOIN_PAGE["JoinGroup.jsx\nlayout próprio Neo-Brutalist"]

    RESOLVE -->|path = /reset-password| ROUTE_RESET[route = 'reset-password']
    ROUTE_RESET --> RESET_PAGE["ResetPassword.jsx\nlayout próprio Neo-Brutalist\n(token via URLSearchParams)"]

    ROUTE_CHAT --> CHECK_TOKEN_C{?token=\npresente?}
    CHECK_TOKEN_C -->|SIM| CHAT_PAGE["ChatAnonimo.jsx\nlayout próprio Neo-Brutalist"]
    CHECK_TOKEN_C -->|NÃO| ERR_TOKEN_C["StatusScreen (Neo-Brutalist)\nErro: Token ausente"]
```

> **StatusScreen** é um componente local definido em `App.jsx` (não é mais um arquivo
> separado) — substitui o antigo `TerminalPanel` para os estados sem rota dedicada.

---

## Diagrama 2 — CTA Flow no AdminDashboard

> Detalhamento completo (estados de view, validação, status de participantes) em
> `docs/modules/orquestrador_grupo.md` Diagrama 1.

```mermaid
flowchart TD
    ADMIN_DASH([AdminDashboard.jsx\nAdmin autenticado]) --> CTA_MENU{Ação do Admin}

    CTA_MENU -->|Criar Grupo| CREATE_GROUP["view='create'\nFormulário inline (título, descrição,\ndraw_date, budget_limit) → groups_create.php"]
    CTA_MENU -->|Selecionar Grupo existente| GROUP_DETAIL[groups_detail.php\nCarrega participantes e status]
    CTA_MENU -->|Enviar Convites| INVITE_FLOW[groups_invite.php\nmailer.php dispara emails]
    CTA_MENU -->|Realizar Sorteio| DRAW_FLOW[groups_draw.php\nVer módulo juiz_sorteio.md]
    CTA_MENU -->|Deletar Grupo| DELETE_GROUP[groups_delete.php\nConfirmação obrigatória]
    CTA_MENU -->|Logout| LOGOUT_FLOW[apiPost /admin_logout.php\nsetAdmin null → AdminAuth]

    CREATE_GROUP --> ADD_PARTICIPANTS["view='detail'\nInput nome+email inline\naddPendingParticipant()"]
    ADD_PARTICIPANTS --> INVITE_FLOW

    INVITE_FLOW --> EMAIL_SENT[Email enviado\nLink: /invite?token=UUID]
    EMAIL_SENT --> INVITE_PAGE_ENTRY([Participante acessa /invite?token=UUID])
```

---

## Diagrama 3 — Fluxo de Self-Invitation (InvitePage.jsx)

```mermaid
sequenceDiagram
    actor P as Participante
    participant B as Browser\n/invite?token=UUID
    participant I as InvitePage.jsx
    participant API as invite.php\ninvite_confirm.php

    P->>B: Clica no link do email
    B->>I: mount com prop token=UUID
    I->>API: GET /invite.php?token=UUID
    API-->>I: {group: {title, description}, participant: {name, email, status}}

    alt status = 'confirmed'
        I-->>P: Exibe "✔ Participação confirmada"
    else status = 'pending'
        I-->>P: Exibe dados do grupo + botão CONFIRMAR PARTICIPAÇÃO
        P->>I: Clica em CONFIRMAR PARTICIPAÇÃO
        I->>API: POST /invite_confirm.php {token: UUID}
        API-->>I: {ok: true}
        I-->>P: Exibe "✔ Participação confirmada. Aguarde o sorteio."
    end

    alt token inválido ou expirado
        API-->>I: {ok: false, error: 'Token inválido'}
        I-->>P: Exibe erro em card Neo-Brutalist (bg-error-container)
    end
```

---

## Diagrama 4 — Fluxo de Adesão Pública (JoinGroup.jsx · Dharma Code)

```mermaid
sequenceDiagram
    actor U as Usuário Externo
    participant B as Browser\n/join?dharma=CODE
    participant J as JoinGroup.jsx
    participant API as groups_get_public.php\ngroups_join.php

    U->>B: Acessa link público compartilhado pelo admin
    B->>J: mount — captura dharma code da URL
    J->>API: GET /groups_get_public.php?dharma=CODE
    API-->>J: {group: {title, description, max_participants}}

    J-->>U: Exibe nome do grupo + formulário de adesão\n(nome + email)

    U->>J: Preenche nome e email → clica em ENTRAR
    J->>API: POST /groups_join.php {dharma: CODE, name, email}

    alt Adesão bem-sucedida
        API-->>J: {ok: true, message: 'Aguarde o convite de confirmação'}
        J-->>U: Exibe mensagem de sucesso
    else Grupo cheio ou código inválido
        API-->>J: {ok: false, error: 'Mensagem de erro'}
        J-->>U: Exibe erro em card Neo-Brutalist (bg-error-container)
    end
```

---

## Layout por Rota (100% Neo-Brutalist — sem CRT)

> **2026-06-29:** Migração completa. Nenhuma rota usa mais TerminalPanel/CRT — o
> componente foi removido do projeto junto com StepIndicator, RetroTyping,
> ThemeContext e themes.js (ver `dependencias_react.md`).

| Situação | Componente principal |
|---|---|
| API não configurada | `StatusScreen` (local em `App.jsx`) |
| Verificando sessão (loading) | `StatusScreen` (local em `App.jsx`) |
| Admin autenticado | AdminDashboard.jsx (full-page) |
| Sem sessão admin | AdminAuth.jsx (full-page) |
| `/invite` com token | InvitePage.jsx (full-page) |
| `/invite` sem token | `StatusScreen` (local em `App.jsx`) |
| `/reveal` com token | RevealPage.jsx (full-page) |
| `/reveal` sem token | `StatusScreen` (local em `App.jsx`) |
| `/chat` com token | ChatAnonimo.jsx (full-page) |
| `/chat` sem token | `StatusScreen` (local em `App.jsx`) |
| `/join` | JoinGroup.jsx (full-page) |
| `/reset-password` | ResetPassword.jsx (full-page, token via URL) |

---

## Pontos de Extensão (Onde Adicionar Features)

| Feature desejada                         | Ponto de inserção                        |
|------------------------------------------|------------------------------------------|
| Nova rota pública                        | `resolveRoute()` em `App.jsx` + novo componente |
| Novo CTA no dashboard                    | `AdminDashboard.jsx` + novo endpoint PHP |
| Novo campo no formulário de convite      | `InvitePage.jsx` + `invite_confirm.php`  |
| Nova classe utilitária Neo-Brutalist      | `src/index.css` (`@layer components`)    |
| Página de erro personalizada             | Novo componente + tratamento em `App.jsx`|
