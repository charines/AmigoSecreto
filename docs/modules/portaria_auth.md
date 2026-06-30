---
module: portaria_auth
domain: SA-01 · A Portaria + SA-02 handoff
components: [App.jsx, AdminAuth.jsx, ForgotPassword.jsx, ResetPassword.jsx, AdminDashboard.jsx, InvitePage.jsx, JoinGroup.jsx]
endpoints:
  [admin_me.php, admin_login.php, admin_forgot_password.php, admin_reset_password.php,
   groups_invite.php, mailer.php, invite.php, invite_confirm.php,
   groups_get_public.php, groups_join.php]
note: >
  Documento de jornada — cobre a entrada completa do usuário desde o acesso à URL
  até as ações do SA-02. Detalhes internos do SA-02 em orquestrador_grupo.md.
last_updated: 2026-06-30
redesign_note: >
  2026-06-28 · Redesign Neo-Brutalist — AdminAuth.jsx layout full-page próprio.
  App.jsx renderiza AdminAuth diretamente, sem TerminalPanel.
forgot_password_note: >
  2026-06-28 · Feature adicionada: Forgot Password completo.
  DB: colunas reset_token_hash + reset_expires em admins (migrate_v5.php).
  Rota: /reset-password → ResetPassword.jsx.
  Segurança: token SHA-256 hash no DB, expiração 1h, anti-enumeração de email.
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
    Note over JOIN: Rota alternativa: /join?dharma=DHARMA_CODE
    U->>JOIN: Acessa link público compartilhado pelo admin
    JOIN->>JOIN: lê query param `dharma`
    JOIN->>API: apiGet('/groups_get_public.php?dharma=DHARMA_CODE')
    API->>JOIN_PHP: GET /groups_get_public.php
    JOIN_PHP-->>API: {group: {title, description, draw_date, budget_limit}}
    API-->>JOIN: dados públicos do grupo
    JOIN-->>U: Info do grupo + formulário nome + e-mail

    U->>JOIN: Preenche campos → clica EXECUTAR PROTOCOLO DE INSCRIÇÃO
    JOIN->>API: apiPost('/groups_join.php', {dharma, name, email})
    API->>JOIN_PHP: POST /groups_join.php
    JOIN_PHP->>JOIN_PHP: INSERT participant + dispara e-mail de convite
    JOIN_PHP-->>API: {ok:true}
    API-->>JOIN: sucesso
    JOIN-->>U: Protocolo Iniciado — verifique seu e-mail
```

---

## Diagrama 2 — Forgot Password (SA-01 · recuperação de acesso)

```mermaid
sequenceDiagram
    actor U as Admin
    participant AUTH as AdminAuth.jsx
    participant FP as ForgotPassword.jsx
    participant RP as ResetPassword.jsx
    participant APP as App.jsx
    participant API_FP as admin_forgot_password.php
    participant API_RP as admin_reset_password.php
    participant MAILER as mailer.php
    participant DB as admins (MySQL)

    %% ── FASE 1: Solicitar link ───────────────────────────────────
    U->>AUTH: Clica "Esqueci minha senha"
    AUTH->>AUTH: setMode('forgot')
    AUTH->>FP: render ForgotPassword(onBack)

    U->>FP: Digita email → clica ENVIAR LINK
    FP->>API_FP: POST /admin_forgot_password.php {email}

    API_FP->>DB: SELECT id, name FROM admins WHERE email = ?

    alt Email cadastrado
        API_FP->>API_FP: rawToken = random_token(32)\ntokenHash = SHA-256(rawToken)\nexpiresAt = NOW() + 3600s
        API_FP->>DB: UPDATE admins SET reset_token_hash = tokenHash,\nreset_expires = expiresAt WHERE id = ?
        API_FP->>MAILER: send_smtp_mail() com link:\n/reset-password?token=rawToken
    else Email não cadastrado
        Note over API_FP: Silencia — não revela se email existe
    end

    API_FP-->>FP: {ok: true, message: "Se esse e-mail..."}
    FP-->>U: "E-mail enviado! Verifique também o spam."

    %% ── FASE 2: Redefinir senha ──────────────────────────────────
    Note over U: Usuário recebe e-mail com link
    U->>APP: Acessa /reset-password?token=rawToken
    APP->>APP: resolveRoute() → 'reset-password'\nresetToken = URLSearchParams.get('token')
    APP->>RP: render ResetPassword(token=rawToken)

    U->>RP: Preenche nova senha + confirmação → REDEFINIR
    RP->>RP: Valida: len >= 6, senha === confirmação
    RP->>API_RP: POST /admin_reset_password.php {token: rawToken, password}

    API_RP->>API_RP: tokenHash = SHA-256(rawToken)
    API_RP->>DB: SELECT id FROM admins\nWHERE reset_token_hash = tokenHash\nAND reset_expires > NOW()

    alt Token válido e não expirado
        API_RP->>DB: UPDATE admins SET\npassword_hash = bcrypt(password),\nreset_token_hash = NULL,\nreset_expires = NULL
        API_RP-->>RP: {ok: true}
        RP-->>U: "Senha redefinida!" + botão "IR PARA O LOGIN"
        U->>APP: window.location.href = '/'
    else Token inválido ou expirado
        API_RP-->>RP: {ok: false, error: "Token invalido ou expirado"} 400
        RP-->>U: Exibe erro em error-container
    end
```

---

## Invariantes de Segurança — Forgot Password

| Invariante | Implementação |
|---|---|
| Token armazenado como hash | `hash('sha256', $rawToken)` no DB — raw token só no e-mail |
| Expiração de 1 hora | `reset_expires = NOW() + 3600` · validado com `> NOW()` no SELECT |
| Token de uso único | `reset_token_hash = NULL` após uso bem-sucedido |
| Anti-enumeração de email | Resposta `{ok: true}` idêntica se email existe ou não |
| Falha de SMTP silenciosa | `error_log()` no servidor — cliente não recebe detalhe do erro |
| Validação de senha mínima | Frontend: 6 chars + confirmação · Backend: `strlen < 6` |
| Token único no índice | `ADD UNIQUE KEY uniq_admins_reset_token_hash` — colisão impossível |

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
