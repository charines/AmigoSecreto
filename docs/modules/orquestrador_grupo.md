---
module: orquestrador_grupo
domain: SA-02 · O Orquestrador de Grupo
components:
  active: [AdminDashboard.jsx, InvitePage.jsx, JoinGroup.jsx]
endpoints:
  [backend/api/groups.ts (action=create), backend/api/groups.ts (action=list), backend/api/groups.ts (action=detail), backend/api/groups.ts (action=delete),
   backend/api/groups.ts (action=invite), backend/api/groups.ts (action=get_public), backend/api/groups.ts (action=join),
   backend/api/participants.ts (action=delete), backend/api/participants.ts (action=resend_invite),
   backend/api/invite.ts (GET), backend/api/invite.ts (POST), backend/lib/mailer.ts]
last_updated: 2026-06-29
redesign_note: >
  2026-06-28 · Redesign Neo-Brutalist — AdminDashboard.jsx (3 views) passou a
  ter layout full-page próprio. App.jsx renderiza o componente diretamente,
  sem TerminalPanel wrapper. Toda lógica de negócio (grupos, participantes,
  convites, sorteio, delete, resend) permanece 100% intacta.
update_note: >
  2026-06-29 · InvitePage.jsx e JoinGroup.jsx migrados para Neo-Brutalist
  (full-page, sem texto/cor CRT). EmailStep.jsx, MembersStep.jsx e
  ResultsStep.jsx — antes listados como "legados" — foram REMOVIDOS do
  projeto: zero importadores confirmados, lógica já reimplementada inline em
  AdminDashboard.jsx.
---

# Módulo: Orquestrador de Grupo (SA-02)

---

## Diagrama 1 — Ciclo de Vida do Grupo e Gestão de Participantes

```mermaid
flowchart TD
    subgraph ADMIN["AdminDashboard.jsx · view state"]
        VIEW_LIST["view = 'list'\nLista de grupos"]
        VIEW_CREATE["view = 'create'\nFormulário de criação"]
        VIEW_DETAIL["view = 'detail'\nDetalhe + participantes"]
    end

    subgraph CREATE["Criação de Grupo"]
        FORM["Form: título · descrição\ndraw_date · budget_limit"]
        POST_CREATE["POST /backend/api/groups.ts (action=create)"]
        RES_CREATE["Grupo criado\nstatus = 'open'\ndharma_code gerado (6 chars)"]
    end

    subgraph MEMBERS["Gestão de Participantes (pending list)"]
        INPUT_NE["Input: nome + email"]
        VALIDATE_EMAIL{"email\ncontém '@'?"}
        ADD_PENDING["addPendingParticipant()\npush → pendingParticipants[]"]
        REMOVE_PENDING["removePendingParticipant(id)\nfilter → pendingParticipants[]"]
        ERR_EMAIL["setError: 'Email invalido'"]
    end

    subgraph SEND_INVITE["Envio de Convites"]
        BTN_INVITE["Botão: ENVIAR CONVITES (n)"]
        POST_INVITE["POST /backend/api/groups.ts (action=invite)\n{group_id, participants[]}"]
        PHP_INSERT["INSERT participants\nstatus='invited'\ninvite_token = random_token(24)"]
        PHP_MAIL["backend/lib/mailer.ts → SMTP\nEmail Dharma Initiative\nLink: /invite?token=<uuid>"]
        RES_INVITE["{sent: [], failed: []}"]
        CLEAR_PENDING["setPendingParticipants([])"]
        RELOAD_DETAIL["loadGroupDetail()"]
    end

    subgraph DELETE_P["Remover Participante"]
        BTN_DEL["[REMOVER] hover\nno item da lista"]
        CONFIRM_DEL{"grupo já\nsorteado?"}
        WARN_DRAWN["Alert: sorteio será\ncancelado!\nTokens invalidados."]
        WARN_OPEN["Confirm padrão"]
        POST_DEL["POST /backend/api/participants.ts (action=delete)\n{participant_id}"]
    end

    subgraph RESEND["Reenvio"]
        BTN_RESEND_INV["REENVIAR CONVITE\n(status: invited / link_clicked)"]
        BTN_RESEND_DRW["REENVIAR SORTEIO\n(status: token_sent / revealed)"]
        POST_RESEND_INV["POST /backend/api/participants.ts (action=resend_invite)"]
        POST_RESEND_DRW["POST /backend/api/participants.ts (action=resend_draw)"]
    end

    subgraph STATUS_MAP["Status dos Participantes (tabela)"]
        S1["invited → CONVITE ENVIADO"]
        S2["link_clicked → LINK CLICADO"]
        S3["confirmed → CONFIRMADO"]
        S4["token_sent → TOKEN ENVIADO"]
        S5["revealed → REVELADO"]
    end

    VIEW_LIST -->|"+ NOVO GRUPO"| VIEW_CREATE
    VIEW_LIST -->|"clica no grupo"| VIEW_DETAIL
    VIEW_CREATE --> FORM --> POST_CREATE --> RES_CREATE
    RES_CREATE -->|"setSelectedGroupId\nsetView('detail')"| VIEW_DETAIL

    VIEW_DETAIL --> INPUT_NE --> VALIDATE_EMAIL
    VALIDATE_EMAIL -->|"sim"| ADD_PENDING
    VALIDATE_EMAIL -->|"não"| ERR_EMAIL
    ADD_PENDING -->|"[REMOVER] inline"| REMOVE_PENDING

    ADD_PENDING --> BTN_INVITE --> POST_INVITE
    POST_INVITE --> PHP_INSERT --> PHP_MAIL --> RES_INVITE
    RES_INVITE --> CLEAR_PENDING --> RELOAD_DETAIL

    VIEW_DETAIL --> BTN_DEL --> CONFIRM_DEL
    CONFIRM_DEL -->|"sim (drawn)"| WARN_DRAWN --> POST_DEL
    CONFIRM_DEL -->|"não (open)"| WARN_OPEN --> POST_DEL
    POST_DEL --> RELOAD_DETAIL

    VIEW_DETAIL --> BTN_RESEND_INV --> POST_RESEND_INV
    VIEW_DETAIL --> BTN_RESEND_DRW --> POST_RESEND_DRW

    VIEW_DETAIL -.-> STATUS_MAP
```

---

## Diagrama 2 — Fluxo de Confirmação de Convite (InvitePage.jsx)

```mermaid
sequenceDiagram
    actor P as Participante
    participant EMAIL as Caixa de E-mail
    participant B as Browser /invite?token=UUID
    participant I as InvitePage.jsx
    participant API_INV as backend/api/invite.ts (GET)
    participant API_CONF as backend/api/invite.ts (POST)
    participant DB as MySQL

    P->>EMAIL: Recebe e-mail Dharma Initiative
    EMAIL-->>P: Link /invite?token=UUID

    P->>B: Clica no link
    B->>I: mount(token=UUID)
    I->>API_INV: GET /api/invite?token=UUID
    API_INV->>DB: SELECT participant, group WHERE invite_token=UUID
    DB-->>API_INV: {participant: {name, email, status}, group: {title, description}}
    API_INV-->>I: {participant, group}

    alt status = 'confirmed'
        I-->>P: "✔ Participação confirmada. Aguarde o sorteio."
    else status = 'invited' ou 'link_clicked'
        I-->>P: Exibe dados do grupo + botão CONFIRMAR PARTICIPAÇÃO
        P->>I: Clica em CONFIRMAR PARTICIPAÇÃO
        I->>API_CONF: POST /backend/api/invite.ts (POST) {token: UUID}
        API_CONF->>DB: UPDATE participants SET status='confirmed' WHERE invite_token=UUID
        DB-->>API_CONF: OK
        API_CONF-->>I: {ok: true}
        I-->>P: "✔ Participação confirmada. Aguarde o sorteio."
    end

    alt token inválido ou não encontrado
        API_INV-->>I: {ok: false, error: 'Participante nao encontrado'}
        I-->>P: "✖ Participante nao encontrado" (card Neo-Brutalist bg-error-container)
    end
```

---

## Diagrama 3 — Auto-Inscrição via Dharma Code (JoinGroup.jsx)

```mermaid
sequenceDiagram
    actor U as Usuário externo
    participant B as Browser /join/<dharma_code>
    participant J as JoinGroup.jsx
    participant API_PUB as backend/api/groups.ts (action=get_public)
    participant API_JOIN as backend/api/groups.ts (action=join)
    participant DB as MySQL

    U->>B: Acessa link público compartilhado pelo admin
    Note over B,J: getJoinCode() extrai último segmento do pathname

    B->>J: mount(code = <dharma_code>)
    J->>API_PUB: GET /api/groups?action=get_public&code=<dharma_code>
    API_PUB->>DB: SELECT group WHERE dharma_code=code AND status='open'
    DB-->>API_PUB: {group: {title, description, draw_date, budget_limit}}
    API_PUB-->>J: {group: {...}}
    J-->>U: Exibe grupo + formulário (nome + e-mail)

    U->>J: Preenche nome e e-mail → clica EXECUTAR PROTOCOLO DE INSCRIÇÃO
    J->>API_JOIN: POST /backend/api/groups.ts (action=join) {code, name, email}
    API_JOIN->>DB: INSERT participant (status='invited')\n+ dispara e-mail de convite
    DB-->>API_JOIN: OK
    API_JOIN-->>J: {ok: true}
    J-->>U: "Protocolo Iniciado — verifique seu e-mail"

    alt dharma_code inválido ou grupo fechado
        API_PUB-->>J: {ok: false, error: 'Grupo nao encontrado'}
        J-->>U: Card de erro Neo-Brutalist (bg-error-container) + botão "Voltar ao início"
    end

    alt nome ou e-mail inválido no envio
        API_JOIN-->>J: {ok: false, error: 'Dados invalidos'}
        J-->>U: Exibe erro inline no formulário
    end
```

---

## Estados do Grupo (status field)

```mermaid
stateDiagram-v2
    [*] --> open : backend/api/groups.ts (action=create)\ndharma_code gerado
    open --> drawn : backend/api/groups_draw.ts\n(min. 2 confirmados)
    open --> cancelled : backend/api/groups.ts (action=delete)
    drawn --> cancelled : backend/api/groups.ts (action=delete)\n(invalida todos os tokens)
    drawn --> open : backend/api/participants.ts (action=delete)\n(se grupo já sorteado)
```

---

## 🔄 Ação Requerida — Obsidian Mirror

```
╔══════════════════════════════════════════════════════╗
║  ⚑  AÇÃO REQUERIDA · MIRROR OBSIDIAN                ║
╠══════════════════════════════════════════════════════╣
║  Módulo: orquestrador_grupo                          ║
║  Arquivo: docs/modules/orquestrador_grupo.md         ║
║  Draw.io: docs/arquitetura.drawio (swimlane SA-02)   ║
║                                                      ║
║  Após qualquer alteração em:                         ║
║  AdminDashboard.jsx · backend/api/groups.ts · backend/api/invite.ts     ║
║                                                      ║
║  1. Atualizar swimlane SA-02 no drawio               ║
║  2. Refletir mudança neste arquivo Mermaid           ║
║  3. Copiar bloco Mermaid atualizado para o vault     ║
║  4. Exportar PNG do drawio para vault                ║
╚══════════════════════════════════════════════════════╝
```
