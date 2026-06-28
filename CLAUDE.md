# AmigoSecreto — Auto-load · Claude Code

**Leia `agent.md` ANTES de qualquer resposta de código.** É a fonte única de verdade do projeto.

## Preflight Obrigatório (6 passos)

1. `@agent.md` carregado e validado nesta sessão
2. `@docs/modules/<modulo_relevante>.md` carregado — apenas o módulo afetado pela task
3. Drift verificado: `git log --oneline -5 -- <arquivos do módulo>` — diagrama sincronizado?
4. Skill de IA ativada conforme `docs/modules/skills_catalog.md` (invocar antes do código)
5. Impacto de segurança avaliado — toca tokens, crypto, SQL ou sessão? → skill `007` obrigatória
6. Build limpo confirmado: `npm run lint && npm run build`

## Regras Rápidas

- Stack: React 19 + Vite 7 + TailwindCSS 4 · PHP 8 REST · MySQL 8
- CSS: sempre via `var(--color-crt-*)` — nunca cores hardcoded
- Sorteio: `src/utils/secretSanta.js` · Crypto: `src/lib/crypto.js` (AES-GCM, não substituir)
- PHP: um endpoint por arquivo em `api/` — sem controllers genéricos
- Sem código sem módulo Mermaid — se não existir, criar o módulo antes

> Documentação completa: `docs/docs_for_llm.md` · Skills: `docs/modules/skills_catalog.md`
