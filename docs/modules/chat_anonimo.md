---
module: chat_anonimo
domain: SA-04 · A Sombra
components: [ChatAnonimo.jsx, TerminalPanel.jsx]
endpoints: [chat_get.php, chat_send.php]
database: [chat_messages, draw_results, participants]
last_updated: 2026-06-28
---

# Módulo: Chat Anônimo (SA-04 · A Sombra)

> **Achado crítico de redesign:** O chat possui **dois canais independentes** por participante,
> não um único. A identidade é mascarada exclusivamente pelo campo `sender_role` na tabela
> `chat_messages` — nenhum PII é armazenado no chat. Ao redesenhar a UI, preservar a
> separação visual de abas e o label dinâmico ('Você' vs 'Meu Amigo Secreto').

> **Tecnologia:** Polling puro a cada 5 segundos via `setInterval`. Não há WebSocket nem SSE.

---

## Diagrama 1 — Arquitetura de Dois Canais

```mermaid
flowchart TD
    subgraph ENTRY["Entrada"]
        URL["/chat?token=<revealToken>"]
        CHAT["ChatAnonimo.jsx\nmount(token=revealToken)"]
    end

    subgraph CHANNELS["Dois Canais de Chat"]
        TAB_A["Aba: 'Para: Meu Amigo Secreto'\nactiveTab = 'amigo'"]
        TAB_B["Aba: 'De: Quem me tirou'\nactiveTab = 'admirador'"]
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

    subgraph DB_SCHEMA["Tabela chat_messages"]
        COLS["id · group_id · draw_id\nsender_role ('giver'|'receiver')\ntexto · created_at"]
        NO_PII["⚠ Sem nome, e-mail ou ID de usuário\nIdentidade = posição no draw_results"]
    end

    URL --> CHAT
    CHAT --> TAB_A
    CHAT --> TAB_B
    TAB_A --> CANAL_AMIGO
    TAB_B --> CANAL_ADM
    CANAL_AMIGO -.-> DB_SCHEMA
    CANAL_ADM -.-> DB_SCHEMA
```

---

## Diagrama 2 — Fluxo de Envio de Mensagem

```mermaid
sequenceDiagram
    actor P as Participante
    participant UI as ChatAnonimo.jsx
    participant API_SEND as chat_send.php
    participant DB as MySQL

    P->>UI: Digita mensagem + clica ENVIAR
    Note over UI: handleSend(e)\ne.preventDefault()\ntextToSend = inputText.trim()\nsetInputText('')

    UI->>API_SEND: POST /chat_send.php\n{token, channel, texto}
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

    Note over UI: setMessages(prev => ({\n  ...prev,\n  [activeTab]: [...prev[activeTab], res.message]\n}))

    UI-->>P: Nova mensagem aparece\nalinhada à direita (isMe=true)\ncor verde CRT · borda verde

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
    participant API_GET as chat_get.php
    participant DB as MySQL

    Note over UI: mount: loadMessages() imediato\n+ setInterval(loadMessages, 5000)

    loop A cada 5 segundos
        TIMER->>UI: dispara loadMessages()
        UI->>API_GET: GET /chat_get.php?token=<revealToken>
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
| Dois canais separados por aba | `activeTab` state + dois arrays em `messages` | **Alta** — lógica central |
| Label 'Você' para mensagens próprias | `msg.role === 'Você'` → `isMe = true` | **Alta** — identidade mascarada |
| Sistema como primeira mensagem | Injetado em `chat_get.php` formatação | **Média** — UX de contexto |
| Polling 5 segundos | `setInterval(loadMessages, 5000)` | **Média** — sem WebSocket |
| Scroll automático ao fundo | `scrollToBottom()` após `setMessages` | **Baixa** — UX |
| Botão voltar para revelação | `window.location.href = /reveal?token=` | **Média** — navegação |
| Entrada desabilitada se texto vazio | `disabled={!inputText.trim()}` | **Baixa** — UX |

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
║  ChatAnonimo.jsx · chat_get.php · chat_send.php      ║
║  Tabelas: chat_messages · draw_results               ║
║                                                      ║
║  1. Atualizar swimlane SA-04 no drawio               ║
║  2. Refletir mudança neste arquivo Mermaid           ║
║  3. Copiar bloco Mermaid atualizado para o vault     ║
║  4. Exportar PNG do drawio para vault                ║
╚══════════════════════════════════════════════════════╝
```
