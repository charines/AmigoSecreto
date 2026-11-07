---
module: backend_core
domain: Infra transversal do backend (serve SA-01 a SA-04)
components: []
endpoints: [backend/api/ping.ts]
lib: [backend/lib/config.ts, backend/lib/db.ts, backend/lib/cors.ts, backend/lib/session.ts, backend/lib/handlers/ping_check.ts]
database: []
last_updated: 2026-11-07
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
    CORS --> APPLY["lib/cors.ts\napplyCors(res, cors) · setHeader"]
    APPLY -->|"OPTIONS → true"| END204["204 + res.end()"]
    APPLY -->|"false"| DISP{"?action= / método"}
    DISP --> H["lib/handlers/&lt;area&gt;_&lt;acao&gt;.ts\nfunção pura (pool, input) → resultado"]
    H --> DB["lib/db.ts\ngetPool(config) · mysql2/promise"]
    H --> RES["res.statusCode = resultado.status\nres.end(JSON.stringify(resultado.body))"]
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

## Status HTTP

- Headers de CORS entram via `applyCors` (`lib/cors.ts`), que usa `setHeader`. Nunca
  `res.writeHead()` em `api/`: ele congela o status e o `res.statusCode` do handler é
  ignorado (até 2026-11-07 todo erro saía como 200 em 7 endpoints).
- Guardrail: `lib/cors.test.ts` falha se algum `api/*.ts` voltar a usar `writeHead(`.
- Frontend não depende do status: `frontend/src/lib/api.js` lança erro com
  `!response.ok || data.ok === false`; todo status ≥ 400 já vinha com `ok:false`.

## Limite de Serverless Functions (Vercel Hobby = 12)

- Cada `backend/api/*.ts` vira uma função própria no deploy.
- `backend/.vercelignore` exclui `api/*.test.ts` do deploy.
- Guardrails contam só `*.ts` sem `*.test.ts`: `.github/workflows/ci.yml` (job de limite)
  e `preflight.sh` (passo do backend). Ambos falham acima de 12.
- Para novas operações, preferir uma nova `?action=` num arquivo existente a criar arquivo novo.

## Dívida conhecida

Ainda com lógica de domínio inline em `api/` (violando §5.7), com teste em `api/*.test.ts`:

| Arquivo              | Função inline | Módulo dono      | Observação                 |
|----------------------|---------------|------------------|----------------------------|
| `api/groups_draw.ts` | `runDraw`     | juiz_sorteio     | Toca crypto → skill `007`  |
| `api/reveal.ts`      | `getReveal`   | juiz_sorteio     | Toca tokens → skill `007`  |
| `api/invite.ts`      | `getInvite`   | orquestrador_grupo | Toca tokens → skill `007` |

`checkHealth` já foi extraído para `lib/handlers/ping_check.ts` (2026-11-06).
