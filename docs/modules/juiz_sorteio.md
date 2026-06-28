---
module: juiz_sorteio
domain: SA-03 · O Juiz
components: [AdminDashboard.jsx, RevealPage.jsx, RevealStep.jsx, ResultsStep.jsx]
utils: [src/utils/secretSanta.js, src/lib/crypto.js]
endpoints: [groups_draw.php, reveal.php, reveal_confirm.php, participants_resend_draw.php]
last_updated: 2026-06-28
---

# Módulo: O Juiz — Sorteio e Revelação (SA-03)

> **Achado crítico de redesign:** `RevealStep.jsx` possui seu próprio efeito typewriter
> implementado com `setInterval` inline — **não usa `RetroTyping.jsx`**. O `RetroTyping.jsx`
> pertence ao `TerminalPanel.jsx`. Ao redesenhar, manter os dois comportamentos separados.

> **Achado de segurança:** O link de revelação embute a chave de descriptografia diretamente
> na URL (`?code=<token>`). O backend nunca recebe essa chave — ela existe apenas no e-mail
> do participante e no browser no momento da revelação. Nunca alterar esse contrato.

---

## Diagrama 1 — Gatilho e Execução do Sorteio

```mermaid
flowchart TD
    subgraph PRECOND["Pré-condições (AdminDashboard)"]
        STATUS{"grupo.status\n= 'open'?"}
        COUNT{"confirmedCount\n≥ 2?"}
        BTN_DRAW["Botão EXECUTAR SORTEIO\nhabilitado"]
        BTN_WAIT["Botão desabilitado\n'AGUARDANDO CONFIRMACOES'"]
        BTN_DONE["Botão desabilitado\n'SORTEIO FINALIZADO'"]
    end

    subgraph ANIM["Modal de Processamento (UI)"]
        S0["RANDOMIZANDO DADOS..."]
        S1["GERANDO CHAVES DE SEGURANÇA..."]
        S2["CRIPTOGRAFANDO RESULTADOS..."]
        S3["ENVIANDO TOKENS POR E-MAIL..."]
        S_OK["SORTEIO REALIZADO COM SUCESSO!"]
    end

    subgraph PHP["groups_draw.php (PHP backend)"]
        PHP1["Valida sessão admin\nValida group_id e status='open'"]
        PHP2["SELECT participants\nWHERE status='confirmed'"]
        PHP3["PHP shuffle()\nCirculariza: pair[i] → pair[(i+1)%n]"]
        PHP4["Para cada par (giver, receiver):"]
        PHP5["token = random_token(24)\nrevealToken = random_token(24)"]
        PHP6["AES-256-GCM\nkey = SHA-256(token)\niv = random_bytes(12)\ncipher = openssl_encrypt(name, key, iv)\npayload = ciphertext + tag_16bytes"]
        PHP7["INSERT draw_results:\ngiver_id · encrypted_payload\niv_b64 · token_hash\ntoken_raw · receiver_id"]
        PHP8["UPDATE participants\nSET reveal_token = revealToken\nWHERE id = giver.id"]
        PHP9["UPDATE groups SET status='drawn'"]
        PHP10["mailer.php → SMTP\nEnvia e-mail Dharma Initiative\nURL: /reveal?token=<revealToken>&code=<token>"]
        PHP11["{ok, sent: [emails], failed: []}"]
    end

    STATUS -->|"sim"| COUNT
    STATUS -->|"não"| BTN_DONE
    COUNT -->|"sim"| BTN_DRAW
    COUNT -->|"não"| BTN_WAIT

    BTN_DRAW -->|"Admin clica"| S0
    S0 -->|"2s interval"| S1 --> S2 --> S3
    S0 -->|"handleDraw()\nPOST /groups_draw.php"| PHP1
    PHP1 --> PHP2 --> PHP3 --> PHP4
    PHP4 --> PHP5 --> PHP6 --> PHP7 --> PHP8 --> PHP9 --> PHP10 --> PHP11
    PHP11 -->|"drawSuccess = true"| S_OK
```

---

## Diagrama 2 — Fluxo Completo de Revelação

```mermaid
sequenceDiagram
    actor P as Participante (Giver)
    participant EMAIL as Caixa de E-mail
    participant B as Browser
    participant RP as RevealPage.jsx
    participant API_RV as reveal.php
    participant CRYPTO as lib/crypto.js
    participant RS as RevealStep.jsx
    participant API_CONF as reveal_confirm.php
    participant DB as MySQL

    P->>EMAIL: Recebe e-mail com link e código
    Note over EMAIL: URL: /reveal?token=<revealToken>&code=<token>
    Note over EMAIL: revealToken = UUID para lookup no DB
    Note over EMAIL: token = chave de descriptografia AES

    P->>B: Clica no link
    B->>RP: mount(token=revealToken)
    Note over RP: Extrai code=<token> de URLSearchParams\nno estado inicial do useState

    RP->>API_RV: GET /reveal.php?token=<revealToken>
    API_RV->>DB: SELECT draw_results WHERE\nreveal_token=revealToken (via participants)
    DB-->>API_RV: {encrypted_payload, iv_b64, giver.name, group.title}
    API_RV-->>RP: {payload: {encrypted, iv_b64}, giver, group}

    Note over RP: useEffect detecta: data carregado + code presente\n→ autoRevealed = true → handleReveal() automático

    RP->>CRYPTO: decryptName(payload.encrypted, payload.iv_b64, code.trim())
    Note over CRYPTO: key = SHA-256(code)\nimporta CryptoKey → AES-GCM\ndecode Base64 → Uint8Array\ncrypto.subtle.decrypt()
    CRYPTO-->>RP: revealedFriend.to = "NOME DO AMIGO SECRETO"

    RP->>API_CONF: POST /reveal_confirm.php {token: revealToken}
    API_CONF->>DB: UPDATE participants SET status='revealed'\nWHERE reveal_token=revealToken
    DB-->>API_CONF: OK

    RP->>RS: render RevealStep({from: giver.name, to: nome})

    Note over RS: FASE 1 — 'decrypt' (typewriter inline)
    RS->>RS: setInterval 36ms\nDigita: "DECRIPTOGRAFANDO RESULTADO SEGURO..."\nchar por char → typed state

    Note over RS: Após 12+ chars: exibe fake log lines\n"VERIFICANDO INTEGRIDADE SHA256_AES256..."\n"CONSULTANDO BANCO DE DADOS SEGURO..."\n"VALIDANDO TOKEN DE SESSÃO ÚNICA..."

    RS->>RS: Mensagem completa → clearInterval\nsetTimeout(950ms) → phase = 'reveal'

    Note over RS: FASE 2 — 'reveal' (animate-fade-in-up)
    RS-->>P: Exibe nome com efeito glitch CRT\n+ bloom glow radial\n+ botão ENVIAR MENSAGEM ANÔNIMA

    P->>B: Clica ENVIAR MENSAGEM ANÔNIMA
    B->>B: window.location.href = /chat?token=<revealToken>

    alt code inválido ou expirado
        CRYPTO-->>RP: Lança exceção (tag inválida)
        RP-->>P: "✖ Codigo invalido ou expirado" (vermelho CRT)
    end

    alt revealToken não encontrado no DB
        API_RV-->>RP: {ok: false, error: '...'}
        RP-->>P: "✖ [mensagem de erro]" (vermelho CRT)
    end
```

---

## Diagrama 3 — Algoritmo de Sorteio (backend PHP)

```mermaid
flowchart TD
    subgraph INPUT["Entrada"]
        PARTS["participants[]\nstatus = 'confirmed'\nOrdenados por ID ASC"]
    end

    subgraph SHUFFLE["Randomização"]
        SH1["PHP: shuffle(participants)\n(Fisher-Yates interno do PHP)"]
        SH2["Circularização:\nfor i in 0..n-1:\n  pairs[i] = {giver: shuffled[i],\n  receiver: shuffled[(i+1) % n]}"]
    end

    subgraph CRYPTO_LOOP["Loop de Criptografia por Par"]
        C1["token = random_token(24)\n← chave de descriptografia do giver"]
        C2["revealToken = random_token(24)\n← token de lookup no DB"]
        C3["key = SHA-256(token)\n← 32 bytes raw"]
        C4["iv = random_bytes(12)\n← nonce GCM único"]
        C5["cipher = AES-256-GCM(\n  plaintext: receiver.name,\n  key: key, iv: iv\n)\npayload = ciphertext || tag_16bytes"]
        C6["INSERT draw_results:\n  giver_id, receiver_id\n  encrypted_payload_b64\n  iv_b64, token_hash, token_raw"]
        C7["UPDATE participants\n  SET reveal_token = revealToken\n  WHERE id = giver.id"]
    end

    subgraph INVARIANTS["Invariantes de Segurança"]
        INV1["O servidor armazena token_raw no DB\nmas a CHAVE nunca é devolvida via API\n→ só enviada por e-mail"]
        INV2["reveal.php retorna apenas\nencrypted_payload + iv_b64\nNunca o nome em texto claro"]
        INV3["A descriptografia ocorre\nexclusivamente no browser\ndo participante (Web Crypto API)"]
    end

    INPUT --> SH1 --> SH2
    SH2 --> C1 --> C2 --> C3 --> C4 --> C5 --> C6 --> C7
    C7 -->|"próximo par"| C1
    C6 -.-> INV1
    INV1 -.-> INV2
    INV2 -.-> INV3
```

---

## Componente RevealStep — Fases de Animação

```mermaid
stateDiagram-v2
    [*] --> decrypt : mount com {from, to}

    state decrypt {
        typing : setInterval 36ms\nDigita DECRYPT_MSG char a char
        fake_logs : Exibe após 12 chars\n3 linhas de log fake
        typing --> fake_logs
        fake_logs --> done : mensagem completa
    }

    decrypt --> reveal : setTimeout 950ms

    state reveal {
        name_card : Nome em uppercase\ntamanho 5xl-6xl\nanimate-glitch-reveal\nbloom glow radial
        confirm_badge : "■ RESULTADO CONFIRMADO E REGISTRADO"\nanimate-pulse
        chat_btn : Botão ENVIAR MENSAGEM ANÔNIMA\n→ /chat?token=<revealToken>
    }
```

---

## 🔄 Ação Requerida — Obsidian Mirror

```
╔══════════════════════════════════════════════════════╗
║  ⚑  AÇÃO REQUERIDA · MIRROR OBSIDIAN                ║
╠══════════════════════════════════════════════════════╣
║  Módulo: juiz_sorteio                                ║
║  Arquivo: docs/modules/juiz_sorteio.md               ║
║  Draw.io: docs/arquitetura.drawio (swimlane SA-03)   ║
║                                                      ║
║  Após qualquer alteração em:                         ║
║  groups_draw.php · reveal.php · reveal_confirm.php   ║
║  RevealPage.jsx · RevealStep.jsx · crypto.js         ║
║                                                      ║
║  ⚠ INVOCAR /007 antes de alterar crypto.js           ║
║     ou qualquer endpoint deste módulo                ║
║                                                      ║
║  1. Atualizar swimlane SA-03 no drawio               ║
║  2. Refletir mudança neste arquivo Mermaid           ║
║  3. Copiar bloco Mermaid atualizado para o vault     ║
║  4. Exportar PNG do drawio para vault                ║
╚══════════════════════════════════════════════════════╝
```
