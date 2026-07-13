# AmigoSecreto — Auto-load · Claude Code

**Leia `agent.md` ANTES de qualquer resposta de código.** É a fonte única de verdade do projeto.

## Preflight Obrigatório (8 passos)

1. `@agent.md` carregado e validado nesta sessão
2. `@docs/modules/<modulo_relevante>.md` carregado — apenas o módulo afetado pela task
3. Drift verificado: `git log --oneline -5 -- <arquivos do módulo>` — diagrama sincronizado?
4. Skill de IA ativada conforme `docs/modules/skills_catalog.md` (invocar antes do código)
5. Impacto de segurança avaliado — toca tokens, crypto, SQL ou sessão? → skill `007` obrigatória
6. Build limpo confirmado: `npm run lint && npm run build`
7. Teste da mudança executado e evidência registrada (automático ou script/manual reproduzível)
8. Toda decisão técnica ancorada em referência `arquivo:linha` (sem isso, tratar como hipótese)

> **Atalho:** `./preflight.sh` executa os passos 1, 2, 3 e 6 automaticamente.

## Scripts de Suporte

### `preflight.sh` — Verificação antes de codificar
```bash
./preflight.sh                    # verifica tudo (build incluído)
./preflight.sh --no-build         # pula npm build (mais rápido)
./preflight.sh --module <nome>    # drift check só do módulo informado
./preflight.sh --sync             # verifica tudo + sincroniza Obsidian ao final
```
Saída: relatório ✓ / ✗ / ⚠ por passo. Exit code ≠ 0 se houver erro bloqueante.

### `sync_obsidian.sh` — Mirror para Obsidian
```bash
./sync_obsidian.sh                # copia docs modificados para o vault
./sync_obsidian.sh --dry-run      # preview sem gravar nada
```
Destino: `/home/dsktop-cwmlq04/Obsidian/Memorias/AmigoSecreto/docs/`
Convenção de nomes: `docs/modules/foo.md` → `docs__modules__foo.md` (path plano com `__`)
Copia apenas arquivos com conteúdo diferente do vault (sem sobrescrever sem mudança).

> Executar `./sync_obsidian.sh` após qualquer alteração em `docs/` ou `agent.md`.

### `scripts/snapshot.sh` — Snapshot completo para análise externa
```bash
./scripts/snapshot.sh             # gera snapshot em /tmp/snapshot_AmigoSecreto_<timestamp>.txt
```
Detecta arquivo de texto por conteúdo (inclui `.php` da API), trunca arquivos grandes e
exclui segredos (`.env`, chaves, lockfiles) marcando-os como `[EXCLUÍDO]` sem despejar
conteúdo. Substitui o antigo `contexto.sh`/`gera_contexto.py` (preservados como
`scripts/*.bak-20260712` por referência).

## Regras Rápidas

- Stack: React 19 + Vite 7 + TailwindCSS 4 · PHP 8 REST · MySQL 8
- CSS: componentes CRT usam `var(--color-crt-*)` · Neo-Brutalist usam `var(--color-nb-*)` e classes `nb-*` — nunca cores hardcoded
- Sorteio: `src/utils/secretSanta.js` · Crypto: `src/lib/crypto.js` (AES-GCM, não substituir)
- PHP: um endpoint por arquivo em `api/` — sem controllers genéricos
- Sem código sem módulo Mermaid — se não existir, criar o módulo antes

> Documentação completa: `docs/docs_for_llm.md` · Skills: `docs/modules/skills_catalog.md`

## 🤖 Guia de Roteamento Multi-IA (Economia de Tokens)

Para maximizar a eficiência e gastar o mínimo de tokens entre os modelos, siga estritamente esta divisão de tarefas:

### 1. Google Gemini (Flash / Pro) -> O "Operador de Contexto Longo"
- **Quando usar:** Varreduras em lote, leitura de logs extensos do `preflight.sh`, ou quando precisar correlacionar o código PHP antigo (`migrate_v2.php` etc.) com o atual.
- **Regra de Custo:** Use a janela de contexto gigante do Gemini para analisar impactos, mas exija que ele responda em tópicos curtos.

### 2. OpenAI GPT (4o / 5) -> O "Gerador de Código Cirúrgico"
- **Quando usar:** Criar componentes de UI Neo-Brutalist ou aplicar correções diretas nos endpoints PHP.
- **Regra de Custo:** Force o GPT a responder estritamente usando blocos `diff` ou apenas a função alterada. Nunca envie o `agent.md` completo para o GPT; passe apenas o arquivo `docs/modules/<modulo>.md` relevante.

### 3. Anthropic Claude (Sonnet / Code) -> O "Arquiteto e Auditor"
- **Quando usar:** Refatorações complexas de criptografia (`secretSanta.js`), lógica de sorteio e execução via CLI (`Claude Code`).
- **Regra de Custo:** Ative o Prompt Caching no Claude fixando este `CLAUDE.md` e o `agent.md` no bloco de leitura rápida.
