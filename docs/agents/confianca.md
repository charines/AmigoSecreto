# Escala de confiança

Quanto o Charles confia na automação neste repositório. Define onde o agente para e pede aprovação.

**Nível atual: 60%** (Fatia autônoma)

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
| 2026-11-06 | 55% → 60% | Charles declarou explicitamente aumento de confiança após sessão de investigação → plano → spec (`/to-spec`) → issue para o redesign do chat unificado | Issue #34 publicada com spec seguindo o template; declaração textual do Charles: "minha confiança em você aumentou para 60%" |

### Registro por ticket

| Data | Ticket | Testes de primeira? | Preflight passou? | Achados da revisão | Retrabalho pedido? |
|---|---|---|---|---|---|
| 2026-11-05 | #27 (infra de e-mail HTML + layout) | Sim (red → green em `mailer.test.ts` e `emailLayout.test.ts`) | Sim (133/133, lint/tsc sem erro) | Review-spec: eixo Spec achou `border-radius` usado em 2 lugares de `emailLayout.ts` contra o requisito explícito de compatibilidade com Outlook (corrigido, removido); cor de rodapé hardcoded fora das constantes de paleta (corrigido, extraída para `COLOR_FOOTER_TEXT`). Eixo Standards: só achados leves de julgamento (import dinâmico em `mailer.test.ts`, Data Clump pequeno em `emailLayout.ts`), sem correção aplicada. Verificação manual feita ao fim: 2 e-mails de teste (text-only e HTML) enviados a `charles@inmade.com.br` via `backend/.env` (não `.env.local`, que tem SMTP_HOST sem DNS válido); ambos confirmados recebidos e corretos por print do Charles (Gmail), incluindo layout HTML (header, heading, CTA, footer) | Sim (2 achados reais de spec corrigidos nesta mesma sessão) |
| 2026-11-06 | #35/#36/#37 (fatia: chat unificado — issue-mãe #34) | Sim (red → green em `chatMerge.test.js`, 5 casos: intercalado, empate estável, colisão id:0 entre canais, canal vazio, ambos vazios — primeiro teste de frontend do projeto, vitest adicionado) | Sim (`preflight.sh --module chat_anonimo` ✓; `npm run build`/`lint` frontend sem erro novo; `npm test` frontend 5/5; testes de backend do chat 12/12 sem alteração, contrato de API intacto) | Review-spec (Standards + Spec em paralelo). Standards: 0 violações duras; 2 smells leves de julgamento (duplicação estrutural dos 2 botões de envio em `ChatAnonimo.jsx`; primitive obsession leve em strings `'amigo'`/`'admirador'`), não corrigidos (julgamento, não bloqueante). Spec: achado real confirmado — guarda de `handleSend` usava `sending` genérico em vez de `sending === channel`, bloqueando envio ao canal ocioso enquanto o outro estava em voo, violando o critério de aceite do ticket #36 ("o outro continua operável"); corrigido nesta sessão. | Sim (1 achado real de spec corrigido nesta mesma sessão) |
| 2026-11-06 | #40/#41/#42/#43 (fatia: login de participante + visão readonly — issue-mãe #39) | Sim (red → green em todos os handlers novos de backend: `participantSessionStore.test.ts`, `requireParticipant.test.ts`, `participant_login.test.ts`, `participant_logout.test.ts`, `participant_me.test.ts`, `participant_set_password.test.ts`, `participant_groups_list.test.ts`, `participant_group_detail.test.ts` — pool fake, mesmo padrão de `admin_login.test.ts`) | Sim (168/168 testes de backend, `tsc --noEmit` sem erro; lint/build do frontend sem erro novo — os 4 erros/3 warnings de lint já existiam antes desta sessão; `preflight.sh --no-build` ✓, avisos de drift de docs pré-existentes) | Review-spec (Standards + Spec em paralelo). Standards: 0 violações duras; smells leves de julgamento (duplicação do template de cookie/401 entre `admin.ts`/`participant.ts` e entre handlers; GroupDetailView recebe ~16 props quando não-readonly; AdminDashboard ainda acumula responsabilidades), não corrigidos (julgamento, espelham convenção pré-existente do domínio admin). Spec: achado real confirmado — `participant_group_detail.ts` aceitava `id` não numérico (`Number('abc')` é `NaN`, e `NaN <= 0` é `false` em JS, furando a guarda de validação), permitindo manipulação de URL passar sem rejeição; corrigido para `!Number.isFinite(groupId) \|\| groupId <= 0` com teste de regressão. | Sim (1 achado real de spec corrigido nesta mesma sessão) |
