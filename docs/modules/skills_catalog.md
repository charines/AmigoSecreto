---
module: skills_catalog
domain: Governança de IA — transversal
ai_agnostic: true
last_updated: 2026-11-05
---

# Módulo: Catálogo de Skills de IA

> **Contexto de uso:** Inclua este arquivo quando a task exigir saber qual skill ativar ou
> como invocá-la na ferramenta de IA em uso. Não inclua junto com módulos funcionais —
> use um ou outro por sessão.

---

## Tabela de Seleção Rápida

| Domínio da task                          | Skill a ativar           |
|------------------------------------------|--------------------------|
| Deploy, segurança, tokens, crypto, SQL   | `007`                    |
| Code review, PR, novo endpoint backend   | `cc-skill-security-review` |
| Criar ou atualizar diagrama Mermaid      | `mermaid-expert`         |
| Novo componente React, otimização UI     | `react-best-practices`   |
| Timing side-channel em comparação de tokens/crypto | `constant-time-analysis` |

**Regra:** uma skill por sessão de trabalho. Skills instaladas em `.claude/skills/`.

---

## Como Invocar por Ferramenta

| Ferramenta        | Invocação                                              |
|-------------------|--------------------------------------------------------|
| **Claude Code**   | `/007`, `/mermaid-expert`, `/react-best-practices` etc.|
| **Cursor**        | Adicionar `@.claude/skills/<skill>/SKILL.md` no contexto do chat |
| **Windsurf**      | Abrir `SKILL.md` da skill e incluir no contexto da sessão |
| **Web chat**      | Colar o conteúdo do `SKILL.md` como primeira mensagem da conversa |
| **Codex / API**   | Incluir `SKILL.md` como system prompt da requisição    |

---

## 1 · `007` — Auditor de Segurança

**Arquivo:** `.claude/skills/007/SKILL.md`
**Risk level:** `critical` | **Idioma:** Português

### Quando é obrigatório neste projeto

```
crypto.js                    → AES-GCM, derivação de chave SHA-256
backend/api/reveal.ts        → endpoint de revelação do sorteio
backend/api/invite.ts        → confirmação de participação por token
backend/api/groups_draw.ts   → execução do sorteio server-side
backend/api/admin.ts         → autenticação de administrador
backend/lib/db.ts            → camada de acesso ao banco de dados
Qualquer novo endpoint       → antes do primeiro deploy
```

### Modos do 007 relevantes para o projeto

| Modo       | Como acionar (Claude Code) | Uso                                        |
|------------|----------------------------|--------------------------------------------|
| `Audit`    | `audite backend/api/`      | Auditoria completa antes de deploy         |
| `Approve`  | `aprove backend/api/<endpoint>.ts` | Veredito: endpoint pronto para produção? |
| `Threat-Model` | `threat-model src/lib/crypto.js` | STRIDE na lógica AES-GCM       |
| `Incident` | `incidente: token vazado`  | Playbook se token de reveal/invite vazar   |
| `Checklist`| `checklist APIs`           | Checklist técnico focado em endpoints TS do backend |

### Superfície de ataque crítica deste projeto

- `AES-GCM` em `crypto.js` — chave derivada de token único via SHA-256
- Tokens UUID em `participants.invite_token` e `participants.reveal_token`
- Cookie de sessão admin cruzando domínios (frontend Vercel ↔ backend Vercel) via CORS
- Queries parametrizadas (`mysql2/promise`) em todos os endpoints do backend
- SMTP credentials em `backend/.env` (local) ou env vars do projeto Vercel
  `amigo-secreto-backend.` — nunca no `.env` do frontend

**Score mínimo para deploy:** 70/100 (Aprovado com ressalvas).

---

## 2 · `cc-skill-security-review` — Checklist Diário

**Arquivo:** `.claude/skills/cc-skill-security-review/SKILL.md`
**Risk level:** `safe` | **Uso:** rotineiro, pré-PR

### Quando usar (vs. quando usar o 007)

- **Este checklist:** revisão rápida (5-10 min) de um PR ou endpoint específico
- **007:** auditoria estruturada de 6 fases (30+ min) antes de deploy

### Checklist prioritário para este projeto

```
[ ] Tokens nunca expostos em logs ou mensagens de erro da API
[ ] Todo SQL novo usa queries parametrizadas (`mysql2/promise`) — zero concatenação de string
[ ] CORS restrito ao domínio do frontend (`APP_ORIGIN` nas env vars do backend)
[ ] Nenhum segredo em src/ — apenas VITE_API_BASE_URL é seguro expor
[ ] Cookies de sessão com HttpOnly + SameSite configurados
[ ] Mensagens de erro da API são genéricas ao usuário (sem stack trace)
[ ] Endpoints de reenvio de email têm rate limiting
```

---

## 3 · `mermaid-expert` — Especialista em Diagramas

**Arquivo:** `.claude/skills/mermaid-expert/SKILL.md`
**Risk level:** `safe`

### Quando usar neste projeto

- Criar novo arquivo em `docs/modules/`
- Atualizar diagrama após implementação de feature
- Traduzir fluxo do `docs/arquitetura.drawio` para Mermaid
- Gerar `sequenceDiagram` de novos endpoints do backend

### Tipos de diagrama por contexto

| Contexto                        | Tipo Mermaid       | Módulo de referência        |
|---------------------------------|--------------------|-----------------------------|
| Fluxo de rota / navegação       | `flowchart TD`     | `menu_inicial.md`           |
| Frontend ↔ API ↔ DB             | `sequenceDiagram`  | `menu_inicial.md`           |
| Schema de banco                 | `erDiagram`        | a criar: `banco.md`         |
| Estados de grupo (lifecycle)    | `stateDiagram-v2`  | a criar: `grupo_lifecycle.md` |
| Dependências entre componentes  | `flowchart TD`     | `dependencias_react.md`     |

**Regra de nomenclatura:** usar sempre o nome exato do componente ou endpoint
(`AdminDashboard.jsx`, `backend/api/groups_draw.ts`) para garantir rastreabilidade código ↔ diagrama.

---

## 4 · `react-best-practices` — Padrões React

**Arquivo:** `.claude/skills/react-best-practices/SKILL.md`
**Risk level:** `safe`

### Quando usar neste projeto

- Criar componente novo em `src/components/`
- Otimizar `AdminDashboard.jsx` (múltiplas chamadas API no mount)
- Otimizar `ChatAnonimo.jsx` (polling manual com setInterval)
- Reduzir re-renders identificados via React Profiler

### ⚠ Regras que NÃO se aplicam — projeto usa Vite SPA, não Next.js

```
server-*              → Server Components, RSC, React.cache — ignorar
async-suspense-*      → sem SSR aqui
server-after-*        → não existe em Vite
```

### Regras de alta relevância para este projeto

| Regra                        | Aplicação                                                    |
|------------------------------|--------------------------------------------------------------|
| `rerender-memo`              | `AdminDashboard`: memoize itens da lista de grupos           |
| `rerender-functional-setstate` | Callbacks em `ChatAnonimo` (setState dentro de polling)    |
| `rerender-lazy-state-init`   | Inicialização de estado pesado em qualquer componente        |
| `client-swr-dedup`           | Substituir polling manual do chat por SWR com `refreshInterval` |
| `bundle-dynamic-imports`     | Lazy load de `AdminDashboard` se crescer além de 50KB        |

---

## 5 · `constant-time-analysis` — Timing Side-Channels

**Arquivo:** `.claude/skills/constant-time-analysis/SKILL.md`
**Risk level:** `unknown` | **Uso:** complementar à `007`, mesma sessão (não conta como skill separada)

### Quando usar neste projeto

- Junto com `007`, ao tocar comparação de segredos: `crypto.js` (chave derivada de token),
  `backend/api/reveal.ts` / `backend/api/invite.ts` (comparação de
  `reveal_token`/`invite_token`), `backend/api/admin.ts` (comparação de senha/hash).
- Antes de qualquer refatoração em `backend/api/groups_draw.ts` que compare tokens ou IDs
  sensíveis.

### O que verificar

```
Comparações de string com == ou === em vez de hash_equals()/timing-safe compare
Branches condicionais cujo tempo de execução depende do valor do segredo
Early-return em loops de comparação byte-a-byte
```

**Nota:** não substitui a `007` — audita um ângulo específico (vazamento por tempo de
execução) que a `007` não cobre em profundidade.

---

## Módulos Mermaid Pendentes de Criação

Os módulos abaixo estão mapeados mas não criados. Sem eles, sessões de codificação nos
domínios correspondentes caem de volta à leitura de código-fonte.

| Módulo a criar             | Sub-agente | Arquivos a mapear                                          |
|----------------------------|------------|------------------------------------------------------------|
| `sorteio.md`               | SA-03      | `backend/api/groups_draw.ts`, `backend/api/reveal.ts`, `crypto.js`, `secretSanta.js`, `RevealPage.jsx` |
| `chat_anonimo.md`          | SA-04      | `ChatAnonimo.jsx`, `backend/api/chat.ts`                   |
| `banco.md`                 | Todos      | `database/schema.mysql.sql`, `backend/db/migrate*.ts`, `backend/lib/db.ts` |
| `grupo_lifecycle.md`       | SA-02/03   | Status: `draft → open → drawn → closed`                    |
