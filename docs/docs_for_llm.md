---
project: AmigoSecreto
type: Central de Contexto LLM
version: 1.5.0
last_updated: 2026-06-29
ai_agnostic: true
---

# DOCS_FOR_LLM.MD — Contexto Operacional e Governança

> Leia `agent.md` antes deste arquivo. Aqui estão os sub-agentes, o Preflight e o Mirror
> Obsidian. **Não inclua este arquivo inteiro em prompts de codificação** — use apenas trechos
> ou seções específicas. Máximo útil por prompt: agent.md + um módulo de `docs/modules/`.

---

## SEÇÃO 1 — Rotina de Preflight (Obrigatória)

Execute antes de qualquer sessão de codificação. `[INCLUIR NO PROMPT]` = copiar para o
contexto da IA. Os demais são verificações locais do desenvolvedor.

```
PREFLIGHT — AmigoSecreto v1.4
══════════════════════════════════════════════════════════════

[ ] 1. CONSTITUIÇÃO CARREGADA
        Arquivo: agent.md
        [INCLUIR NO PROMPT]

[ ] 2. MÓDULO MERMAID DO CONTEXTO
        Arquivo: docs/modules/<modulo_relevante>.md
        Regra: apenas o módulo do domínio afetado — nunca todos de uma vez.
        Se o módulo não existir: criar antes de codificar (ver agent.md §8).
        [INCLUIR NO PROMPT]

[ ] 3. VERIFICAÇÃO DE DRIFT
        Confirmar que o módulo Mermaid (item 2) reflete o estado atual do código.
        Executar localmente:

          git log --oneline -5 -- <arquivos mapeados no módulo>

        Se houver commits nos arquivos de código SEM commit correspondente
        no arquivo .md do módulo: PARAR e avisar o desenvolvedor para
        atualizar o diagrama antes de continuar a sessão.

        Arquivos por módulo:
          menu_inicial.md     → App.jsx, InvitePage.jsx, JoinGroup.jsx,
                                AdminDashboard.jsx, api/invite.php,
                                api/invite_confirm.php, api/groups_join.php
          dependencias_react.md → qualquer arquivo em src/
          sorteio.md (futuro) → groups_draw.php, reveal.php, crypto.js,
                                secretSanta.js, RevealPage.jsx
          chat_anonimo.md (futuro) → ChatAnonimo.jsx, chat_get.php, chat_send.php
        [EXECUTAR LOCALMENTE — não incluir no prompt]

[ ] 4. SKILL DE IA SELECIONADA
        Consultar docs/modules/skills_catalog.md para selecionar e invocar
        a skill adequada ao domínio da task antes de gerar código.
        [INVOCAR ANTES DO PROMPT DE CÓDIGO]

[ ] 5. ROTA / COMPONENTE IDENTIFICADO
        Qual rota (App.jsx) e componente principal serão alterados?
        [NÃO INCLUIR — uso interno do dev]

[ ] 6. ENDPOINT PHP IDENTIFICADO
        Qual(is) arquivo(s) em api/*.php serão tocados?
        [NÃO INCLUIR — uso interno do dev]

[ ] 7. IMPACTO DE SEGURANÇA
        A mudança toca: tokens? sessão? criptografia? SQL?
        Se sim: skill 007 obrigatória (ver skills_catalog.md).
        [CONDICIONAL — incluir seção Segurança do agent.md no prompt]

[ ] 8. VARIÁVEIS DE AMBIENTE
        .env e .env.local corretos para o ambiente alvo?
        VITE_API_BASE_URL aponta para o backend correto?
        [NÃO INCLUIR — verificação local]

[ ] 9. BUILD LIMPO
        npm run lint && npm run build → zero erros.
        [NÃO INCLUIR — CI/local]

[ ] 10. TESTE DA MUDANÇA
        Executar teste automatizado relevante ao escopo.
        Se não houver teste automatizado no escopo, executar script/manual reproduzivel
        e registrar evidência objetiva (comando + resultado).
        [NÃO INCLUIR — CI/local]

[ ] 11. EVIDÊNCIAS DA ENTREGA
        Registrar no resumo técnico:
          - comandos executados
          - resultado (sucesso/falha)
          - riscos residuais
        [NÃO INCLUIR — uso interno do dev]

[ ] 12. REFERÊNCIAS TÉCNICAS EXPLÍCITAS
        Toda decisão técnica deve citar `arquivo:linha` que a sustenta.
        Sem citação verificável, tratar como hipótese e validar antes de codar.
        [INCLUIR NO PROMPT]

[ ] 13. OBSIDIAN MIRROR CHECK
        O módulo Mermaid foi sincronizado no cofre após a última sessão?
        Se não: atualizar antes de iniciar nova codificação (ver Seção 4).
        [NÃO INCLUIR — lembrete ao dev]

══════════════════════════════════════════════════════════════
REGRA DE ECONOMIA: prompt ideal = agent.md + 1 módulo Mermaid.
Nunca incluir este arquivo por inteiro.
```

---

## SEÇÃO 2 — Mapa de Sub-agentes Lógicos

Sub-agentes são **personas de contexto** — não processos separados. Ao trabalhar em um
domínio, incluir no prompt apenas os arquivos listados naquele sub-agente.

---

### SA-01 · A PORTARIA

**Responsabilidade:** Autenticação e sessão do administrador.

**Arquivos de domínio:**
```
src/components/AdminAuth.jsx
api/admin_login.php
api/admin_logout.php
api/admin_me.php
api/admin_register.php
```

**Fluxo:**
```
App.jsx resolveRoute() → route='admin'
  → apiGet('/admin_me.php') → [cookie presente?]
    ├── SIM → setAdmin() → AdminDashboard
    └── NÃO → AdminAuth → onAuth() → setAdmin
```

**Invariantes:**
- Sessão via cookie HTTP-only (`session_start()` no PHP).
- `admin_me.php` chamado em todo mount do App na rota admin.
- Logout via POST em `admin_logout.php` antes de limpar estado local.

---

### SA-02 · O ORQUESTRADOR

**Responsabilidade:** Ciclo de vida de grupos e participantes.

**Arquivos de domínio:**
```
src/components/AdminDashboard.jsx
src/components/InvitePage.jsx
src/components/JoinGroup.jsx
api/groups_create.php   api/groups_delete.php
api/groups_detail.php   api/groups_get_public.php
api/groups_invite.php   api/groups_join.php
api/groups_list.php     api/invite.php
api/invite_confirm.php  api/participants_delete.php
api/participants_resend_invite.php  api/mailer.php
```

**Fluxos:**
```
Criação:   AdminDashboard.jsx (view='create', formulário inline)
           → POST groups_create.php

Convite:   groups_invite.php → mailer.php → email /invite?token=UUID
           → InvitePage.jsx → invite.php → invite_confirm.php

Adesão:    /join/<dharma_code> → JoinGroup.jsx → groups_join.php
```

> 2026-06-29: `EmailStep.jsx`, `MembersStep.jsx` e `ResultsStep.jsx` foram removidos do
> projeto (zero importadores) — a criação de grupo já vivia 100% inline em
> `AdminDashboard.jsx` desde o redesign Neo-Brutalist.

**Invariantes:**
- Tokens de convite são UUIDs gerados no PHP, em `participants.invite_token`.
- Grupo só pode ser sorteado com todos os convites `confirmed`.
- SMTP configurado exclusivamente em `api/.env`.

---

### SA-03 · O JUIZ

**Responsabilidade:** Sorteio, revelação e criptografia.

**Arquivos de domínio:**
```
src/utils/secretSanta.js
src/lib/crypto.js
src/components/RevealPage.jsx
src/components/RevealStep.jsx
api/draw.php              api/groups_draw.php
api/reveal.php            api/reveal_confirm.php
api/participants_resend_draw.php
database/schema.mysql.sql
```

**Fluxo de sorteio:**
```
AdminDashboard → groups_draw.php
  → PHP busca participantes confirmados
  → Derangement server-side (espelho de secretSanta.js)
  → AES-GCM: encripta nome do sorteado (chave = token do participante)
  → Armazena encrypted_name + iv
  → Dispara emails com /reveal?token=<token>
```

**Fluxo de revelação:**
```
RevealPage.jsx ← ?token=
  → GET /reveal.php → {encrypted_name, iv}
  → decryptName(encrypted_name, iv, token) [crypto.js]
  → Exibe nome → POST /reveal_confirm.php
```

**Invariante crítica:** o servidor **jamais** envia o nome em texto claro. A chave AES
existe apenas no link enviado ao email — nunca armazenada no banco como chave legível.

---

### SA-04 · A SOMBRA

**Responsabilidade:** Canal anônimo entre participantes.

**Arquivos de domínio:**
```
src/components/ChatAnonimo.jsx
api/chat_get.php
api/chat_send.php
```

**Fluxo:**
```
/chat?token= → ChatAnonimo.jsx
  → Polling: GET /chat_get.php (mensagens do grupo)
  → POST /chat_send.php (sem revelar identidade do remetente)
```

**Invariante:** `receiver_id` em `chat_messages` permite mensagens direcionadas sem
expor o remetente. Frontend exibe apenas "Anônimo".

---

## SEÇÃO 3 — Mapa de Dependências Críticas

```
App.jsx
  ├── StatusScreen (componente local, sem token/loading/erro de API)
  ├── AdminAuth.jsx     ← api.js                          [SA-01]
  ├── AdminDashboard.jsx ← api.js                         [SA-02]
  ├── InvitePage.jsx    ← api.js                          [SA-02]
  ├── JoinGroup.jsx     ← api.js                          [SA-02]
  ├── RevealPage.jsx    ← api.js ← crypto.js              [SA-03]
  └── ChatAnonimo.jsx   ← api.js                          [SA-04]
```

> 2026-06-29: `TerminalPanel.jsx`, `StepIndicator.jsx`, `RetroTyping.jsx` e
> `ThemeContext.jsx`/`themes.js` foram removidos do projeto (zero importadores). Não há
> mais nenhum componente de tema/shell CRT — todas as telas são Neo-Brutalist.

**Arquivos de maior impacto (alterar com máxima cautela):**

| Arquivo               | Dependentes diretos | Skill obrigatória antes de alterar |
|-----------------------|---------------------|------------------------------------|
| `src/lib/api.js`      | 7 (todas as rotas)  | `cc-skill-security-review`         |
| `src/lib/crypto.js`   | 1 (RevealPage)      | `007` obrigatório                  |

---

## SEÇÃO 4 — Diretriz do Mirror Obsidian

### Quando sincronizar (obrigatório)

| Evento                              | Ação no Obsidian                                  |
|-------------------------------------|---------------------------------------------------|
| Nova feature implementada           | Atualizar nota do módulo + nota de decisão        |
| Diagrama drawio alterado            | Exportar PNG + atualizar Mermaid do módulo        |
| Nova skill catalogada               | Atualizar `skills_catalog.md` do vault            |
| Bug crítico corrigido               | `incidents/YYYY-MM-DD-<bug>.md`                   |
| Schema de banco alterado            | `database/schema.md` no vault                     |
| Variável de ambiente adicionada     | `infra/env-vars.md` no vault                      |

### Estrutura do Vault Obsidian

```
AmigoSecreto/
├── 00-constituicao/   → agent.md (espelho)
├── 01-modulos/        → docs/modules/*.md (espelhos)
├── 02-arquitetura/
│   ├── macro.png      → export do arquitetura.drawio
│   └── decisoes/      → YYYY-MM-DD-<decisao>.md
├── 03-banco/          → schema.md
├── 04-infra/          → env-vars.md
└── 05-incidents/      → YYYY-MM-DD-<bug>.md
```

### Formato de bloco para sync (Markdown limpo e portável)

~~~markdown
# [Módulo] — [Data]

## Contexto
[Por que essa mudança foi feita]

## O que mudou
[Descrição técnica concisa]

## Arquivos afetados
- `caminho/arquivo.jsx` — motivo

## Diagrama
```mermaid
[bloco copiado de docs/modules/]
```

## Próximos passos
- [ ] item pendente
~~~

### Aviso de Ação Requerida (AiR)

Emitir ao final de qualquer implementação que afete módulos documentados:

```
╔══════════════════════════════════════════════════════╗
║  ⚑  AÇÃO REQUERIDA · MIRROR OBSIDIAN                ║
╠══════════════════════════════════════════════════════╣
║  Módulo afetado : [nome do módulo]                   ║
║  Arquivo Mermaid: docs/modules/[modulo].md           ║
║  Draw.io        : docs/arquitetura.drawio            ║
║                                                      ║
║  Antes do commit:                                    ║
║  1. Atualizar drawio (ext. VS Code)                  ║
║  2. Refletir mudança no Mermaid do módulo            ║
║  3. Copiar bloco Mermaid para vault Obsidian         ║
║  4. Exportar PNG do drawio para vault                ║
╚══════════════════════════════════════════════════════╝
```

---

## SEÇÃO 5 — Manual Operacional (Draw.io → Mermaid → IA → Obsidian)

Pipeline obrigatório para toda feature ou alteração significativa.

### Passo 1 · Idealização Visual (Draw.io)

**Onde:** `docs/arquitetura.drawio` via extensão `hediet.vscode-drawio` no VS Code.

- Desenhe o fluxo antes de qualquer código
- Swimlanes: Frontend (React) / Backend (PHP) / Database (MySQL)
- Nomes dos shapes = nomes exatos dos componentes e endpoints

### Passo 2 · Tradução para Mermaid

**Onde:** `docs/modules/<nome_do_modulo>.md`

- Extraia o trecho do drawio referente ao módulo afetado
- Um arquivo por domínio funcional — não misturar SA-02 com SA-03 no mesmo arquivo
- Nomes dos nós = nomes exatos dos componentes (`InvitePage.jsx`, `invite.php`)

### Passo 3 · Preflight + Skill + Prompt

**Sequência:**
```
1. Executar Preflight (Seção 1 deste arquivo)
2. Verificar drift (item 3 do Preflight)
3. Ativar skill adequada (docs/modules/skills_catalog.md)
4. Enviar ao modelo: @agent.md + @docs/modules/<modulo>.md
```

**Prompt mínimo eficiente:**
```
[conteúdo de agent.md]
[conteúdo de docs/modules/<modulo>.md]

Task: [descrição objetiva do que implementar]
```

Nunca incluir este arquivo (`docs_for_llm.md`) por inteiro no prompt.

### Passo 4 · Sincronização Obsidian

Imediatamente após o commit, antes de iniciar a próxima task:
1. Copiar Mermaid atualizado para o vault
2. Exportar PNG do drawio (File → Export no Draw.io)
3. Criar nota de decisão se houver escolha arquitetural nova

### Pipeline Visual

```
Feature Request
      │
      ▼
┌─────────────────────┐
│  1. Draw.io         │  Fluxo visual no arquitetura.drawio
│  (VS Code ext.)     │  Sem código antes deste passo
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  2. Mermaid         │  docs/modules/<modulo>.md
│  (docs/modules/)    │  skill: mermaid-expert
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  3. Preflight + IA  │  Drift check → Skill → @agent.md + @modulo.md
│  (Claude/Cursor/…)  │  skills_catalog.md define qual skill usar
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  3.5 Security Gate  │  cc-skill-security-review antes do merge
│  (pré-merge)        │  007 obrigatório antes de deploy
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  4. Obsidian Sync   │  Mermaid + PNG + notas de decisão
│  (vault pessoal)    │  Memória histórica humana
└─────────────────────┘
```

---

## SEÇÃO 6 — Definition of Done (DoD) e Evidências

Uma task só pode ser considerada concluída quando TODOS os itens abaixo forem verdadeiros:

1. Escopo implementado nos arquivos corretos, sem alteração fora do domínio da task.
2. Drift validado para o módulo Mermaid afetado.
3. `npm run lint` sem erros.
4. `npm run build` sem erros.
5. Teste do comportamento alterado executado e documentado.
6. Resumo final com evidências objetivas:
   - comando executado
   - resultado observado
   - arquivos tocados
   - riscos residuais
7. Toda afirmação técnica relevante ancorada em citação `arquivo:linha`.

Regra de bloqueio:
- Se um item do DoD falhar, a entrega deve ser marcada como parcial e o motivo explicitado.
