# Escala de confiança

Quanto o Charles confia na automação neste repositório. Define onde o agente para e pede aprovação.

**Nível atual: 55%** (Fatia supervisionada)

**commit_autonomo: não**

Só o Charles altera o nível e o `commit_autonomo`. O agente pode **propor** mudança de nível (no `/retro`), sempre citando o histórico abaixo.

## Faixas

Mudanças de nível de 10 em 10.

| Faixa | Nome | O agente faz sozinho | O agente para e pede aprovação |
|---|---|---|---|
| 0–19% | Supervisão total | Ler, investigar, propor | Antes de cada arquivo editado |
| 20–39% | Plano por ticket | Depois do plano do ticket aprovado: editar arquivos, rodar testes, lint e build | No fim de cada ticket (resumo + diff) |
| 40–59% | Fatia supervisionada | Com spec e tickets aprovados, executar ticket após ticket | Entre um ticket e outro |
| 60–79% | Fatia autônoma | Executar a fatia inteira, criar branch | No fim da fatia |
| 80–100% | Fábrica | Encadear fatias, rodar `/retro` | No fim do ciclo |

## Fixo em qualquer nível

- **Commit e push** só com autorização explícita do Charles, a cada vez, enquanto `commit_autonomo: não`. Trava técnica: regra `ask` em `.claude/settings.json` (ou aprovação manual do CLAUDE.md global).
- **Lógica de negócio, banco de dados ou operações destrutivas** exigem confirmação específica (regra do `CLAUDE.md` do projeto e do global).
- **Mudança pequena** (um arquivo, sem lógica de negócio) não precisa do fluxo completo: segue plano → aprovação → execução.

## Histórico

Registrar ao fim de cada ticket só fatos verificáveis. A avaliação subjetiva é do Charles.

### Mudanças de nível

| Data | De → Para | Motivo | Evidência |
|---|---|---|---|
| 2026-11-05 | — → 55% | Nível inicial definido pelo Charles | Primeira criação deste arquivo, repositório já com fluxo spec → tickets (`to-spec`/`to-tickets`) em uso (issues #26–#30) |

### Registro por ticket

| Data | Ticket | Testes de primeira? | Preflight passou? | Achados da revisão | Retrabalho pedido? |
|---|---|---|---|---|---|
| 2026-11-05 | #27 (infra de e-mail HTML + layout) | Sim (red → green em `mailer.test.ts` e `emailLayout.test.ts`) | Sim (133/133, lint/tsc sem erro) | Review-spec: eixo Spec achou `border-radius` usado em 2 lugares de `emailLayout.ts` contra o requisito explícito de compatibilidade com Outlook (corrigido, removido); cor de rodapé hardcoded fora das constantes de paleta (corrigido, extraída para `COLOR_FOOTER_TEXT`). Eixo Standards: só achados leves de julgamento (import dinâmico em `mailer.test.ts`, Data Clump pequeno em `emailLayout.ts`), sem correção aplicada. Verificação manual feita ao fim: 2 e-mails de teste (text-only e HTML) enviados a `charles@inmade.com.br` via `backend/.env` (não `.env.local`, que tem SMTP_HOST sem DNS válido); ambos confirmados recebidos e corretos por print do Charles (Gmail), incluindo layout HTML (header, heading, CTA, footer) | Sim (2 achados reais de spec corrigidos nesta mesma sessão) |
