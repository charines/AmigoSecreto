---
module: dependencias_react
domain: Todos os sub-agentes (visão transversal)
components: todos os src/
generated_from: react-map.json (madge)
last_updated: 2026-06-28
---

# Módulo: Mapa de Dependências React

> **Contexto de uso:** Inclua este arquivo em prompts sobre impacto transversal de mudanças,
> refatorações em arquivos centrais (`api.js`, `ThemeContext.jsx`) ou criação de novos componentes.
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
    end

    subgraph LAYOUT["Layout · Shell CRT"]
        PANEL["TerminalPanel.jsx"]
        RETRO["RetroTyping.jsx"]
        STEP["StepIndicator.jsx"]
    end

    subgraph SA01["SA-01 · Portaria"]
        AUTH["AdminAuth.jsx"]
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

    subgraph TEMA["Sistema de Temas"]
        THEME_CTX["ThemeContext.jsx"]
        THEMES["themes/themes.js"]
        CSS["index.css"]
    end

    %% Entrypoint
    MAIN --> APP
    MAIN --> THEME_CTX
    MAIN --> CSS

    %% Roteamento → Componentes
    APP --> AUTH
    APP --> DASH
    APP --> CHAT
    APP --> INVITE
    APP --> JOIN
    APP --> REVEAL_P
    APP --> PANEL
    APP --> API

    %% SA-01
    AUTH --> API

    %% SA-02
    DASH --> API
    INVITE --> API
    JOIN --> API

    %% SA-03
    REVEAL_P --> REVEAL_S
    REVEAL_P --> API
    REVEAL_P --> CRYPTO

    %% SA-04
    CHAT --> PANEL
    CHAT --> API

    %% Layout Shell
    PANEL --> RETRO
    PANEL --> STEP
    PANEL --> THEME_CTX
    RETRO --> THEME_CTX

    %% Tema
    THEME_CTX --> THEMES
```

---

## Tabela de Impacto por Arquivo

Ordena arquivos pelo número de dependentes diretos e indiretos — quanto maior, maior o risco
de alterar.

| Arquivo | Dependentes diretos | Impacto | Observação |
|---|---|---|---|
| `lib/api.js` | 7 (App + todos os SA) | **CRÍTICO** | Toca tudo — qualquer mudança exige teste em todas as rotas |
| `ThemeContext.jsx` | 3 (main, TerminalPanel, RetroTyping) | **ALTO** | Afeta toda a UI visual |
| `TerminalPanel.jsx` | 2 (App, ChatAnonimo) | **MÉDIO-ALTO** | Layout shell de quase todas as telas |
| `RetroTyping.jsx` | 1 (TerminalPanel) | **MÉDIO** | Via TerminalPanel, afeta indiretamente tudo |
| `lib/crypto.js` | 1 (RevealPage) | **MÉDIO** | Impacto isolado mas crítico — segurança |
| `themes/themes.js` | 1 (ThemeContext) | **BAIXO** | Mudança de dados sem lógica |
| `RevealStep.jsx` | 1 (RevealPage) | **BAIXO** | Componente folha de apresentação |
| `StepIndicator.jsx` | 1 (TerminalPanel) | **BAIXO** | Componente folha |

---

## Componentes Folha (sem dependências)

Arquivos que não importam nenhum outro módulo do projeto. Seguros para alterar de forma isolada.

```
lib/api.js          ← folha de chamadas externas (fetch)
lib/crypto.js       ← folha de criptografia (Web Crypto API nativa)
themes/themes.js    ← folha de dados (objeto de configuração)
index.css           ← folha de estilos globais
RevealStep.jsx      ← folha de apresentação
StepIndicator.jsx   ← folha de apresentação
```

---

## Clusters de Mudança Segura

Agrupa componentes que podem ser alterados juntos sem risco de efeito colateral entre clusters.

| Cluster | Arquivos | Pode alterar sem afetar outro cluster? |
|---|---|---|
| A — Auth Admin | `AdminAuth.jsx` | Sim |
| B — Grupo | `AdminDashboard.jsx`, `InvitePage.jsx`, `JoinGroup.jsx` | Sim |
| C — Reveal | `RevealPage.jsx`, `RevealStep.jsx`, `crypto.js` | Sim |
| D — Chat | `ChatAnonimo.jsx` | Sim (usa TerminalPanel mas não o modifica) |
| E — Shell | `TerminalPanel.jsx`, `RetroTyping.jsx`, `StepIndicator.jsx` | **Não** — afeta A, B, C, D via App |
| F — Tema | `ThemeContext.jsx`, `themes.js` | **Não** — afeta E que afeta tudo |
| G — API | `api.js` | **Não** — afeta todos os clusters |
