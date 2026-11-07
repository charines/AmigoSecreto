---
module: backend_core
domain: Infra transversal do backend (serve SA-01 a SA-04)
components: []
endpoints: [backend/api/ping.ts]
lib: [backend/lib/config.ts, backend/lib/db.ts, backend/lib/cors.ts, backend/lib/session.ts, backend/lib/handlers/ping_check.ts]
database: []
last_updated: 2026-11-06
---

# Módulo: Backend Core (Vercel Functions)

> Esqueleto comum a todos os endpoints de `backend/api/`: config, CORS, pool MySQL e
> healthcheck. Regra de camadas (`agent.md` §5.7): o arquivo em `api/` só faz CORS,
> dispatch e serialização; a lógica de domínio vive em `lib/handlers/*.ts`, testável
> com um `Pool` falso.

---

## Diagrama 1 — Ciclo de uma requisição

```mermaid
flowchart TD
    REQ["Requisição HTTP"] --> API["backend/api/&lt;area&gt;.ts\nhandler(req, res)"]
    API --> CFG["lib/config.ts\nloadConfig(process.env)"]
    CFG --> CORS["lib/cors.ts\nbuildCorsResponse(config.cors, method)"]
    CORS -->|"OPTIONS → 204"| END204["res.end()"]
    CORS -->|"demais métodos"| DISP{"?action= / método"}
    DISP --> H["lib/handlers/&lt;area&gt;_&lt;acao&gt;.ts\nfunção pura (pool, input) → resultado"]
    H --> DB["lib/db.ts\ngetPool(config) · mysql2/promise"]
    H --> RES["res.end(JSON.stringify(resultado))"]
```

## Diagrama 2 — Healthcheck (`/api/ping`)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant P as api/ping.ts
    participant H as lib/handlers/ping_check.ts
    participant DB as MySQL
    C->>P: GET /api/ping
    P->>H: checkHealth(getPool(config))
    H->>DB: SELECT 1
    alt banco responde
        H-->>P: {ok:true, server:true, db:true}
    else erro de conexão/query
        H-->>P: {ok:false, server:true, db:false, db_error:'Banco indisponivel'}
    end
    P-->>C: 200 + JSON
```

---

## Limite de Serverless Functions (Vercel Hobby = 12)

- Cada `backend/api/*.ts` vira uma função própria no deploy.
- `backend/.vercelignore` exclui `api/*.test.ts` do deploy.
- Guardrails contam só `*.ts` sem `*.test.ts`: `.github/workflows/ci.yml` (job de limite)
  e `preflight.sh` (passo do backend). Ambos falham acima de 12.
- Para novas operações, preferir uma nova `?action=` num arquivo existente a criar arquivo novo.

## Extração de lógica de domínio (concluída)

Toda função de domínio saiu de `api/` para `lib/handlers/` (agent.md §5.7). Nenhum
`*.test.ts` resta em `api/`.

| Endpoint             | Função        | Handler                          | Módulo dono        | Data       |
|----------------------|---------------|----------------------------------|--------------------|------------|
| `api/ping.ts`        | `checkHealth` | `lib/handlers/ping_check.ts`     | backend_core       | 2026-11-06 |
| `api/invite.ts`      | `getInvite`   | `lib/handlers/invite_get.ts`     | orquestrador_grupo | 2026-11-07 |
| `api/reveal.ts`      | `getReveal`   | `lib/handlers/reveal_get.ts`     | juiz_sorteio       | 2026-11-07 |
| `api/groups_draw.ts` | `runDraw`     | `lib/handlers/groups_draw.ts`    | juiz_sorteio       | 2026-11-07 |

## Dívida conhecida

- **Status HTTP sempre 200 em erro** em `chat.ts`, `groups.ts`, `groups_draw.ts`, `invite.ts`,
  `participants.ts` e `reveal.ts`: `res.writeHead(200, …)` envia o status antes de
  `res.statusCode = result.status`. O frontend não sente (`frontend/src/lib/api.js:30` também
  confere `data.ok`), mas logs/monitoramento da Vercel não veem 4xx. `admin.ts` e
  `participant.ts` já usam `setHeader`. Ver `docs/audits/2026-11-07-007-extracao-handlers.md`.
