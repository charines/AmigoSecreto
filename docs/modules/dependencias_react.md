---
module: dependencias_react
domain: Todos os sub-agentes (visão transversal)
components: todos os src/
generated_from: react-map.json (madge)
last_updated: 2026-06-29
redesign_note: >
  2026-06-28 · Redesign Neo-Brutalist — ChatAnonimo, AdminAuth, AdminDashboard e
  RevealPage removeram a dependência de TerminalPanel.
update_note: >
  2026-06-29 · Migração Neo-Brutalist concluída: InvitePage.jsx e JoinGroup.jsx
  redesenhados (full-page). TerminalPanel.jsx, StepIndicator.jsx, RetroTyping.jsx,
  ThemeContext.jsx e themes/themes.js foram REMOVIDOS do projeto (zero
  importadores). App.jsx não depende mais de nenhum deles — define um componente
  local `StatusScreen` para os estados de erro/loading. `main.jsx` não usa mais
  `ThemeProvider`. EmailStep.jsx, MembersStep.jsx e ResultsStep.jsx também foram
  removidos (código morto sem importadores, anterior à reescrita do
  AdminDashboard.jsx como arquivo único).
---

# Módulo: Mapa de Dependências React

> **Contexto de uso:** Inclua este arquivo em prompts sobre impacto transversal de mudanças,
> refatorações em arquivos centrais (`api.js`, `index.css`) ou criação de novos componentes.
> Não inclua junto a módulos funcionais específicos — use um ou outro por prompt.

---

## Diagrama — Grafo de Dependências por Sub-agente

```mermaid
flowchart TD
    subgraph ENTRY["Entrypoint"]
        MAIN["main.jsx"]
    end

    subgraph ROUTER["Roteamento"]
        APP["App.jsx"]
        STATUS["StatusScreen\n(componente local, sem token/loading)"]
    end

    subgraph SA01["SA-01 · Portaria"]
        AUTH["AdminAuth.jsx"]
        FORGOT["ForgotPassword.jsx"]
        RESET["ResetPassword.jsx"]
    end

    subgraph SA02["SA-02 · Orquestrador de Grupo"]
        DASH["AdminDashboard.jsx"]
        INVITE["InvitePage.jsx"]
        JOIN["JoinGroup.jsx"]
    end

    subgraph SA03["SA-03 · O Juiz"]
        REVEAL_P["RevealPage.jsx"]
        REVEAL_S["RevealStep.jsx"]
    end

    subgraph SA04["SA-04 · A Sombra"]
        CHAT["ChatAnonimo.jsx"]
    end

    subgraph LIBS["Libs / Utils"]
        API["lib/api.js"]
        CRYPTO["lib/crypto.js"]
    end

    subgraph CSS_SUB["Estilos"]
        CSS["index.css\n(Neo-Brutalist puro)"]
    end

    %% Entrypoint
    MAIN --> APP
    MAIN --> CSS

    %% Roteamento → Componentes
    APP --> AUTH
    APP --> DASH
    APP --> CHAT
    APP --> INVITE
    APP --> JOIN
    APP --> REVEAL_P
    APP --> STATUS
    APP --> API
    APP --> RESET

    %% SA-01
    AUTH --> API
    AUTH --> FORGOT
    FORGOT --> API
    RESET --> API

    %% SA-02
    DASH --> API
    INVITE --> API
    JOIN --> API

    %% SA-03
    REVEAL_P --> REVEAL_S
    REVEAL_P --> API
    REVEAL_P --> CRYPTO

    %% SA-04
    CHAT --> API
```

---

## Tabela de Impacto por Arquivo

Ordena arquivos pelo número de dependentes diretos e indiretos — quanto maior, maior o risco
de alterar.

| Arquivo | Dependentes diretos | Impacto | Observação |
|---|---|---|---|
| `lib/api.js` | 9 (App + todos os SA + recuperação de senha) | **CRÍTICO** | Toca tudo — qualquer mudança exige teste em todas as rotas |
| `lib/crypto.js` | 1 (RevealPage) | **MÉDIO** | Impacto isolado mas crítico — segurança |
| `RevealStep.jsx` | 1 (RevealPage) | **BAIXO** | Componente folha de apresentação |

---

## Componentes Folha (sem dependências)

Arquivos que não importam nenhum outro módulo do projeto. Seguros para alterar de forma isolada.

```
lib/api.js          ← folha de chamadas externas (fetch)
lib/crypto.js       ← folha de criptografia (Web Crypto API nativa)
index.css           ← folha de estilos globais (100% Neo-Brutalist)
RevealStep.jsx      ← folha de apresentação
```

---

## Clusters de Mudança Segura

Agrupa componentes que podem ser alterados juntos sem risco de efeito colateral entre clusters.
Não há mais cluster de "Shell CRT" ou "Tema" — ambos foram removidos do projeto em 2026-06-29
(ver `update_note` do frontmatter).

| Cluster | Arquivos | Pode alterar sem afetar outro cluster? |
|---|---|---|
| A — Auth Admin | `AdminAuth.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx` | Sim |
| B — Grupo | `AdminDashboard.jsx`, `InvitePage.jsx`, `JoinGroup.jsx` | Sim |
| C — Reveal | `RevealPage.jsx`, `RevealStep.jsx`, `crypto.js` | Sim |
| D — Chat | `ChatAnonimo.jsx` | Sim (layout próprio Neo-Brutalist) |
| E — API | `api.js` | **Não** — afeta todos os clusters |
