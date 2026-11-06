---
module: chat_anonimo
domain: SA-04 · A Sombra
components: [ChatAnonimo.jsx, frontend/src/lib/chatMerge.js]
endpoints: [backend/api/chat.ts (GET), backend/api/chat.ts (POST)]
database: [chat_messages, draw_results, participants]
last_updated: 2026-11-06
redesign_note: >
  2026-06-28 · Redesign Neo-Brutalist — ChatAnonimo.jsx passou a ter layout
  full-page próprio (header + bottom nav Neo-Brutalist). TerminalPanel removido.
  App.jsx renderiza ChatAnonimo diretamente quando token presente.
  2026-11-06 · Chat unificado — as duas abas ('Para: Meu Amigo' / 'De: Quem me
  tirou') foram substituídas por uma única timeline, mesclando os dois canais
  em ordem cronológica via frontend/src/lib/chatMerge.js. A composição de
  mensagem passou a ter dois botões de envio (um por canal) no lugar do botão
  único + aba ativa.
---

# Módulo: Chat Anônimo (SA-04 · A Sombra)

> **Achado crítico de redesign:** O chat possui **dois canais independentes** por participante,
> não um único. A identidade é mascarada exclusivamente pelo campo `sender_role` na tabela
> `chat_messages` — nenhum PII é armazenado no chat. Desde o redesign de 2026-11-06, a UI não
> separa mais os canais por aba: as mensagens dos dois canais aparecem numa única timeline
> ordenada por tempo, cada uma identificada por um badge de canal + direção (`Para:`/`De:` +
> label dinâmico 'Amigo Secreto'/'Admirador Secreto'). A cor de fundo da bolha continua
> indicando só quem enviou ('Você' vs. o outro), não o canal.

> **Tecnologia:** Polling puro a cada 5 segundos via `setInterval`. Não há WebSocket nem SSE.

---

## Diagrama 1 — Arquitetura de Dois Canais

```mermaid
flowchart TD
    subgraph ENTRY["Entrada"]
        URL["/chat?token=<revealToken>"]
        CHAT["ChatAnonimo.jsx\nmount(token=revealToken)"]
    end

    subgraph SEND["Composição — dois botões de envio"]
        SEND_A["Botão: 'Para quem eu tirei'\nhandleSend('amigo')"]
        SEND_B["Botão: 'Para quem me tirou'\nhandleSend('admirador')"]
    end

    subgraph CANAL_AMIGO["Canal 'amigo' — Participante é o GIVER"]
        A_DESC["Participante escreve\npara quem ELE sorteou"]
        A_DB["draw_results\nWHERE giver_id = participantId"]
        A_ROLE["senderRole = 'giver'"]
        A_LABEL_ME["Minhas msgs → role: 'Você'"]
        A_LABEL_OTHER["Msgs recebidas → role: 'Meu Amigo Secreto'"]
    end

    subgraph CANAL_ADM["Canal 'admirador' — Participante é o RECEIVER"]
        B_DESC["Participante lê msgs\nde quem o sorteou"]
        B_DB["draw_results\nWHERE receiver_id = participantId"]
        B_ROLE["senderRole = 'receiver'"]
        B_LABEL_ME["Minhas msgs → role: 'Você'"]
        B_LABEL_OTHER["Msgs recebidas → role: 'Meu Admirador Secreto'"]
    end

    subgraph MERGE["Timeline unificada"]
        MG["chatMerge.js: mergeChannels({amigo, admirador})\nmescla os 2 arrays, ordena por timestamp,\nanota channel + key (channel-id)"]
        RENDER["Lista única renderizada\ncom badge 'Para:'/'De:' + canal por mensagem"]
    end

    subgraph DB_SCHEMA["Tabela chat_messages"]
        COLS["id · group_id · draw_id\nsender_role ('giver'|'receiver')\ntexto · created_at"]
        NO_PII["⚠ Sem nome, e-mail ou ID de usuário\nIdentidade = posição no draw_results"]
    end

    URL --> CHAT
    CHAT --> SEND_A
    CHAT --> SEND_B
    SEND_A --> CANAL_AMIGO
    SEND_B --> CANAL_ADM
    CANAL_AMIGO --> MG
    CANAL_ADM --> MG
    MG --> RENDER
    CANAL_AMIGO -.-> DB_SCHEMA
    CANAL_ADM -.-> DB_SCHEMA
```

---

## Diagrama 2 — Fluxo de Envio de Mensagem

```mermaid
sequenceDiagram
    actor P as Participante
    participant UI as ChatAnonimo.jsx
    participant API_SEND as backend/api/chat.ts (POST)
    participant DB as MySQL

    P->>UI: Digita mensagem + clica em um dos dois botões de envio\n(define o channel diretamente, sem aba prévia)
    Note over UI: handleSend(channel)\ntextToSend = inputText.trim()\nsetInputText('')\nsetSending(channel)

    UI->>API_SEND: POST /backend/api/chat.ts (POST)\n{token, channel, texto}
    Note over API_SEND: token = revealToken (lookup de participante)\nchannel = 'amigo' | 'admirador'\ntexto = conteúdo da mensagem

    API_SEND->>DB: SELECT participants\nWHERE reveal_token = token
    DB-->>API_SEND: {participantId, groupId}

    alt channel = 'amigo' (participante é GIVER)
        API_SEND->>DB: SELECT draw_results\nWHERE giver_id = participantId
        DB-->>API_SEND: {drawId}
        Note over API_SEND: senderRole = 'giver'
    else channel = 'admirador' (participante é RECEIVER)
        API_SEND->>DB: SELECT draw_results\nWHERE receiver_id = participantId
        DB-->>API_SEND: {drawId}
        Note over API_SEND: senderRole = 'receiver'
    end

    API_SEND->>DB: INSERT chat_messages\n(group_id, draw_id, sender_role, texto)
    DB-->>API_SEND: insertedId + created_at

    API_SEND-->>UI: {ok: true, message: {id, role: 'Você', texto, timestamp}}

    Note over UI: setMessages(prev => ({\n  ...prev,\n  [channel]: [...prev[channel], res.message]\n}))\nsetSending(null)

    UI-->>P: Nova mensagem aparece na timeline única\nalinhada à direita (isMe=true)\nbadge de canal acima da bolha (bg-primary)

    alt token inválido
        API_SEND-->>UI: {ok: false, error: 'Participante nao encontrado'} 404
        Note over UI: console.error (sem UI de erro)
    end

    alt channel inválido (não 'amigo' nem 'admirador')
        API_SEND-->>UI: {ok: false, error: 'Canal invalido'} 400
    end

    alt draw_result não encontrado (sorteio antigo sem receiver_id)
        API_SEND-->>UI: {ok: false, error: 'Chat do admirador nao disponivel'} 404
        Note over UI: Funcionalidade não disponível\npara sorteios anteriores à migrate_v4
    end
```

---

## Diagrama 3 — Polling e Exibição de Mensagens

```mermaid
sequenceDiagram
    participant TIMER as setInterval (5000ms)
    participant UI as ChatAnonimo.jsx
    participant API_GET as backend/api/chat.ts (GET)
    participant DB as MySQL

    Note over UI: mount: loadMessages() imediato\n+ setInterval(loadMessages, 5000)

    loop A cada 5 segundos
        TIMER->>UI: dispara loadMessages()
        UI->>API_GET: GET /api/chat?token=<revealToken>
        API_GET->>DB: SELECT participants WHERE reveal_token=token
        DB-->>API_GET: {participantId}

        API_GET->>DB: SELECT draw_results WHERE giver_id=participantId
        DB-->>API_GET: drawIdAmigo (ou null)

        API_GET->>DB: SELECT chat_messages WHERE draw_id=drawIdAmigo ORDER BY id ASC
        DB-->>API_GET: amigoMsgs[]

        API_GET->>DB: SELECT draw_results WHERE receiver_id=participantId
        DB-->>API_GET: drawIdAdmirador (ou null)

        API_GET->>DB: SELECT chat_messages WHERE draw_id=drawIdAdmirador ORDER BY id ASC
        DB-->>API_GET: admiradorMsgs[]

        Note over API_GET: Formata mensagens:\nGiver msgs:\n  sender_role='giver' → role='Você'\n  sender_role='receiver' → role='Meu Amigo Secreto'\nAdmirador msgs:\n  sender_role='receiver' → role='Você'\n  sender_role='giver' → role='Meu Admirador Secreto'

        API_GET-->>UI: {ok: true, messages: {amigo: [], admirador: []}}
        Note over UI: setMessages(res.messages)\nsetLoading(false)

        UI->>UI: scrollToBottom()\n(messagesEndRef.current.scrollIntoView)
    end

    Note over UI: unmount → clearInterval(timer)
```

---

## Diagrama 4 — Lógica de Mascaramento de Identidade

```mermaid
flowchart TD
    subgraph IDENTIFY["Como o sistema sabe quem é quem"]
        TOKEN["revealToken no URL\n(identifica o participante)"]
        LOOKUP["SELECT participants\nWHERE reveal_token = token"]
        PID["participantId"]
    end

    subgraph CANAL_A["Resolução canal 'amigo'"]
        QA["SELECT draw_results\nWHERE giver_id = participantId"]
        DID_A["drawId → mensagens\ndeste par específico"]
    end

    subgraph CANAL_B["Resolução canal 'admirador'"]
        QB["SELECT draw_results\nWHERE receiver_id = participantId"]
        DID_B["drawId → mensagens\ndeste par específico"]
    end

    subgraph LABELS["Labels exibidos no frontend"]
        L1["Minhas msgs\n(role = sender_role do meu canal)\n→ 'Você' · cor verde · direita"]
        L2["Msgs do outro\n(role ≠ sender_role do meu canal)\n→ 'Meu Amigo Secreto' · âmbar · esquerda"]
        L3["Msgs do sistema\n→ centralizadas · opacidade 40%"]
    end

    subgraph NOMATCH["Sem PII no chat_messages"]
        NM1["Não armazena: nome · email · participantId"]
        NM2["Armazena apenas: sender_role · texto · timestamps"]
        NM3["Identidade inferida somente\npelo token no momento da consulta"]
    end

    TOKEN --> LOOKUP --> PID
    PID --> QA --> DID_A
    PID --> QB --> DID_B
    DID_A --> LABELS
    DID_B --> LABELS
    LABELS -.-> NOMATCH
```

---

## Regras de Negócio Preservar no Redesign

| Regra | Origem no código | Criticidade |
|---|---|---|
| Dois canais mesclados numa timeline única, ordenada por timestamp | `frontend/src/lib/chatMerge.js` (`mergeChannels`) + dois arrays em `messages` | **Alta** — lógica central |
| Badge de canal + direção por mensagem | `channelLabel`/`channelAccent` em `ChatAnonimo.jsx` | **Alta** — identificação visual do canal |
| Label 'Você' para mensagens próprias | `msg.role === 'Você'` → `isMe = true` | **Alta** — identidade mascarada |
| Dois botões de envio, um por canal | `handleSend('amigo')` / `handleSend('admirador')` | **Alta** — substitui seleção de aba |
| Sistema como primeira mensagem | Injetado em `backend/api/chat.ts (GET)` formatação | **Média** — UX de contexto |
| Polling 5 segundos | `setInterval(loadMessages, 5000)` | **Média** — sem WebSocket |
| Scroll automático ao fundo | `scrollToBottom()` após `setMessages` | **Baixa** — UX |
| Botão voltar para revelação | `window.location.href = /reveal?token=` | **Média** — navegação |
| Entrada desabilitada se texto vazio | `disabled={!inputText.trim()}` | **Baixa** — UX |

---

## Diagrama 5 — Composição do Shell Neo-Brutalist (pós-redesign 2026-06-28)

> **Nota de redesign:** `ChatAnonimo.jsx` não usa mais `TerminalPanel`. Possui
> header sticky e bottom nav próprios com estética Neo-Brutalist. `App.jsx` renderiza
> `ChatAnonimo` diretamente quando `token` está presente na rota `/chat`.

```mermaid
sequenceDiagram
    actor U as Participante
    participant APP as App.jsx
    participant CA as ChatAnonimo.jsx
    participant API as lib/api.js
    participant CGP as backend/api/chat.ts (GET)
    participant CSP as backend/api/chat.ts (POST)

    %% ── Montagem direta (sem TerminalPanel) ─────────────────────
    U->>APP: Acessa /chat?token=revealToken
    APP->>APP: resolveRoute() → 'chat'\ntoken = getTokenParam()
    APP->>CA: render ChatAnonimo(token=revealToken)

    %% ── Inicialização e carga inicial ───────────────────────────
    CA->>API: apiGet('/api/chat?token=revealToken')
    activate CGP
    API->>CGP: GET /api/chat?token=revealToken
    CGP->>CGP: SELECT participants WHERE reveal_token=token
    CGP->>CGP: Canal amigo: draw_results WHERE giver_id=participantId
    CGP->>CGP: Canal admirador: draw_results WHERE receiver_id=participantId
    Note over CGP: sender_role='giver'    → 'Você' ou 'Meu Amigo Secreto'<br/>sender_role='receiver' → 'Você' ou 'Meu Admirador Secreto'<br/>Sem PII em chat_messages
    CGP-->>API: {ok:true, messages:{amigo:[], admirador:[]}}
    deactivate CGP
    API-->>CA: messages
    CA->>CA: setMessages() → setLoading(false)<br/>scrollToBottom() via messagesEndRef
    CA-->>U: Header Neo-Brutalist + timeline única mesclada (chatMerge)

    %% ── Polling automático ──────────────────────────────────────
    loop A cada 5 segundos — sem WebSocket
        CA->>API: apiGet('/api/chat?token=revealToken')
        API->>CGP: GET /backend/api/chat.ts (GET)
        CGP-->>API: messages estado atual
        API-->>CA: dados atualizados
        CA->>CA: setMessages() → scrollToBottom()
    end

    %% ── Mesclagem para timeline única ────────────────────────────
    CA->>CA: unifiedMessages = mergeChannels(messages)<br/>useMemo([messages])
    Note over CA: useEffect([unifiedMessages])<br/>→ scrollToBottom() automático

    %% ── Envio de mensagem ───────────────────────────────────────
    U->>CA: Digita mensagem + clica em um dos dois botões de envio
    CA->>CA: handleSend(channel) · textToSend = inputText.trim()<br/>setInputText('') imediato · setSending(channel)

    CA->>API: apiPost('/backend/api/chat.ts (POST)',<br/>{token, channel, texto})
    activate CSP
    API->>CSP: POST /backend/api/chat.ts (POST)
    CSP->>CSP: SELECT participants WHERE reveal_token=token

    alt channel = 'amigo' — sou o GIVER
        CSP->>CSP: draw_results WHERE giver_id=participantId<br/>senderRole='giver'
    else channel = 'admirador' — sou o RECEIVER
        CSP->>CSP: draw_results WHERE receiver_id=participantId<br/>senderRole='receiver'
    end

    CSP->>CSP: INSERT chat_messages(group_id, draw_id, sender_role, texto)
    CSP-->>API: {ok:true, message:{id, role:'Você', texto, timestamp}}
    deactivate CSP

    API-->>CA: new message
    CA->>CA: setMessages(prev => ({...prev,<br/>[channel]: [...prev[channel], msg]}))<br/>setSending(null) · scrollToBottom()
    CA-->>U: Msg própria: direita · bg-primary (vermelho)<br/>Msg recebida: esquerda · bg-secondary-container (amarelo)<br/>Badge de canal acima da bolha nos dois casos
    Note over CA,U: Sistema: centralizado · opacidade reduzida<br/>(posição cronológica real na timeline, não fixa no topo)

    %% ── Saída ───────────────────────────────────────────────────
    U->>CA: Clica VOLTAR PARA REVELAÇÃO
    CA->>APP: window.location.href = /reveal?token=revealToken
    Note over APP: clearInterval() no cleanup do useEffect
```

---

## 🔄 Ação Requerida — Obsidian Mirror

```
╔══════════════════════════════════════════════════════╗
║  ⚑  AÇÃO REQUERIDA · MIRROR OBSIDIAN                ║
╠══════════════════════════════════════════════════════╣
║  Módulo: chat_anonimo                                ║
║  Arquivo: docs/modules/chat_anonimo.md               ║
║  Draw.io: docs/arquitetura.drawio (swimlane SA-04)   ║
║                                                      ║
║  Após qualquer alteração em:                         ║
║  ChatAnonimo.jsx · backend/api/chat.ts (GET) · backend/api/chat.ts (POST)      ║
║  Tabelas: chat_messages · draw_results               ║
║                                                      ║
║  1. Atualizar swimlane SA-04 no drawio               ║
║  2. Refletir mudança neste arquivo Mermaid           ║
║  3. Copiar bloco Mermaid atualizado para o vault     ║
║  4. Exportar PNG do drawio para vault                ║
╚══════════════════════════════════════════════════════╝
```
