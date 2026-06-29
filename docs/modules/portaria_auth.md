---
module: portaria_auth
domain: SA-01 · A Portaria + SA-02 handoff
components: [App.jsx, AdminAuth.jsx, AdminDashboard.jsx, InvitePage.jsx, JoinGroup.jsx]
endpoints:
  [admin_me.php, admin_login.php, groups_invite.php, mailer.php,
   invite.php, invite_confirm.php, groups_get_public.php, groups_join.php]
note: >
  Documento de jornada — cobre a entrada completa do usuário desde o acesso à URL
  até as ações do SA-02. Detalhes internos do SA-02 em orquestrador_grupo.md.
last_updated: 2026-06-28
redesign_note: >
  2026-06-28 · Redesign Neo-Brutalist — AdminAuth.jsx passou a ter layout
  full-page próprio (star-pattern, card neo-brutalist, botão nb-btn-primary).
  App.jsx renderiza AdminAuth diretamente, sem TerminalPanel wrapper.
  Lógica de auth (apiPost, onAuth, mode, setError) 100% preservada.
---

# Módulo: Portaria e Autenticação (SA-01 · A Portaria)

> **Contexto de uso:** Inclua este arquivo em prompts sobre autenticação de admin,
> gestão de sessão (cookie HttpOnly), fluxo de convite e auto-inscrição via Dharma Code.
> Para detalhes internos de grupos e participantes, use `orquestrador_grupo.md`.

---

## Diagrama 1 — Jornada Completa: Auth → Convite → Confirmação → Auto-inscrição

```mermaid
sequenceDiagram
    actor U as Usuário/Browser
    participant APP as App.jsx
    participant AUTH as AdminAuth.jsx
    participant DASH as AdminDashboard.jsx
    participant API as lib/api.js
    participant ME as admin_me.php
    participant LOGIN as admin_login.php
    participant INV_PHP as groups_invite.php
    participant MAILER as mailer.php
    participant INV_PAGE as InvitePage.jsx
    participant INV_CONF as invite.php · invite_confirm.php
    participant JOIN as JoinGroup.jsx
    participant JOIN_PHP as groups_get_public.php · groups_join.php

    %% ── FASE 1: Verificação de sessão ──────────────────────────
    U->>APP: Acessa / (rota admin)
    APP->>APP: resolveRoute() → 'admin'
    APP->>API: apiGet('/admin_me.php')
    API->>ME: GET + cookie de sessão HttpOnly

    alt Sessão ativa (cookie válido)
        ME-->>API: {admin: {id, email}}
        API-->>APP: admin data
        APP->>DASH: render AdminDashboard (step='dashboard')
    else Sem sessão ou expirada
        ME-->>API: 401
        API-->>APP: throw Error
        APP->>AUTH: render AdminAuth (step='auth')

        %% ── FASE 2: Login ───────────────────────────────────────
        U->>AUTH: Insere email + senha → pressiona [ENTER]
        AUTH->>API: apiPost('/admin_login.php', {email, password})
        API->>LOGIN: POST /admin_login.php

        alt Credenciais válidas
            LOGIN-->>API: {ok:true, admin} + Set-Cookie session
            API-->>AUTH: admin data
            AUTH->>APP: onAuth(admin) callback
            APP->>DASH: render AdminDashboard (step='dashboard')
        else Credenciais inválidas
            LOGIN-->>API: {ok:false, error: 'Credenciais invalidas'}
            API-->>AUTH: throw Error
            AUTH-->>U: ✖ Erro exibido em vermelho CRT
        end
    end

    %% ── FASE 3: Convite de participantes (SA-02 handoff) ────────
    U->>DASH: Preenche nome + email → clica [+] ADICIONAR
    DASH->>DASH: addPendingParticipant()<br/>push → pendingParticipants[]

    U->>DASH: Clica ENVIAR CONVITES (n participantes)
    DASH->>API: apiPost('/groups_invite.php', {group_id, participants[]})
    API->>INV_PHP: POST /groups_invite.php (sessão admin validada)
    INV_PHP->>INV_PHP: INSERT participants<br/>status='invited', invite_token=random_token(24)
    INV_PHP->>MAILER: send_smtp_mail() para cada participante
    Note over MAILER: E-mail Dharma Initiative<br/>Link: /invite?token=invite_token
    MAILER-->>INV_PHP: sent[] · failed[]
    INV_PHP-->>API: {ok:true, sent, failed}
    API-->>DASH: resultado
    DASH-->>U: Modal: CONVITES ENVIADOS COM SUCESSO!

    %% ── FASE 4: Confirmação de convite pelo participante ────────
    Note over INV_PAGE: Rota: /invite?token=UUID
    U->>INV_PAGE: Clica link do e-mail recebido
    INV_PAGE->>API: apiGet('/invite.php?token=UUID')
    API->>INV_CONF: GET /invite.php
    INV_CONF-->>API: {participant: {name, email, status}, group: {title}}
    API-->>INV_PAGE: dados do convite

    alt status = 'confirmed'
        INV_PAGE-->>U: ✔ Participação já confirmada
    else status = 'invited' ou 'link_clicked'
        INV_PAGE-->>U: Dados do grupo + botão CONFIRMAR PARTICIPAÇÃO
        U->>INV_PAGE: Clica CONFIRMAR PARTICIPAÇÃO
        INV_PAGE->>API: apiPost('/invite_confirm.php', {token: UUID})
        API->>INV_CONF: POST /invite_confirm.php
        INV_CONF->>INV_CONF: UPDATE participants SET status='confirmed'
        INV_CONF-->>API: {ok:true}
        API-->>INV_PAGE: OK
        INV_PAGE-->>U: ✔ Participação confirmada. Aguarde o sorteio.
    end

    %% ── FASE 5: Auto-inscrição via Dharma Code ──────────────────
    Note over JOIN: Rota alternativa: /join/DHARMA_CODE
    U->>JOIN: Acessa link público compartilhado pelo admin
    JOIN->>JOIN: getJoinCode()<br/>extrai último segmento do pathname
    JOIN->>API: apiGet('/groups_get_public.php?code=DHARMA_CODE')
    API->>JOIN_PHP: GET /groups_get_public.php
    JOIN_PHP-->>API: {group: {title, description, draw_date, budget_limit}}
    API-->>JOIN: dados públicos do grupo
    JOIN-->>U: Info do grupo + formulário nome + e-mail

    U->>JOIN: Preenche campos → clica EXECUTAR PROTOCOLO DE INSCRIÇÃO
    JOIN->>API: apiPost('/groups_join.php', {code, name, email})
    API->>JOIN_PHP: POST /groups_join.php
    JOIN_PHP->>JOIN_PHP: INSERT participant + dispara e-mail de convite
    JOIN_PHP-->>API: {ok:true}
    API-->>JOIN: sucesso
    JOIN-->>U: Protocolo Iniciado — verifique seu e-mail
```

---

## Estados de Sessão Admin

```mermaid
stateDiagram-v2
    [*] --> checking : App.jsx monta\napiGet('/admin_me.php')
    checking --> authenticated : cookie válido\n→ setAdmin(data)
    checking --> unauthenticated : 401 / erro\n→ setAdmin(null)
    unauthenticated --> authenticated : login bem-sucedido\napiPost('/admin_login.php')
    authenticated --> unauthenticated : logout\napiPost('/admin_logout.php')\nsetAdmin(null)
```

---

## Invariantes de Segurança (SA-01)

| Invariante | Implementação |
|---|---|
| Sessão via cookie HttpOnly | PHP `session_start()` + `Set-Cookie: HttpOnly` |
| `admin_me.php` chamado em todo mount | `useEffect([], [route])` no App.jsx |
| Logout via POST antes de limpar estado | `handleLogout()` chama endpoint antes de `setAdmin(null)` |
| Credenciais nunca em `localStorage` | Apenas cookie de sessão — nenhum token no browser storage |

---

## 🔄 Ação Requerida — Obsidian Mirror

```
╔══════════════════════════════════════════════════════╗
║  ⚑  AÇÃO REQUERIDA · MIRROR OBSIDIAN                ║
╠══════════════════════════════════════════════════════╣
║  Módulo: portaria_auth                               ║
║  Arquivo: docs/modules/portaria_auth.md              ║
║  Draw.io: docs/arquitetura.drawio (swimlane SA-01)   ║
║                                                      ║
║  Após qualquer alteração em:                         ║
║  AdminAuth.jsx · admin_login.php · admin_me.php      ║
║  admin_logout.php · admin_register.php               ║
║                                                      ║
║  1. Atualizar swimlane SA-01 no drawio               ║
║  2. Refletir mudança neste arquivo Mermaid           ║
║  3. Copiar bloco Mermaid atualizado para o vault     ║
║  4. Exportar PNG do drawio para vault                ║
╚══════════════════════════════════════════════════════╝
```
