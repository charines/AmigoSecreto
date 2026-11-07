# 007 · Extração de handlers de domínio (2026-11-07)

Modo: **Audit** focado no refactor (sem mudança de comportamento) + achados pré-existentes nos
fluxos tocados. Os scripts automáticos da skill apontam para caminhos Windows inexistentes nesta
sessão; análise manual.

## 1. Resumo do sistema

Refactor que move `getInvite`, `getReveal` e `runDraw` de `backend/api/*.ts` para
`backend/lib/handlers/{invite_get,reveal_get,groups_draw}.ts`. Os endpoints HTTP, as queries SQL,
a geração de tokens e a criptografia não foram alterados.

Evidência de equivalência (script reproduzível no PR):
- corpo das funções de domínio: idêntico byte a byte ao `main@10a6031` (fora as linhas de import);
- `export default handler` dos 3 endpoints: idêntico;
- testes: idênticos, exceto o caminho do import; 168/168 passando.

## 2. Mapa de ataque (fluxos tocados)

| Entrada | Trust boundary | Ativo |
|---|---|---|
| `GET /api/invite?token=` | público, token de 24 bytes (`lib/session.ts:24`, `randomBytes`) | nome/e-mail do participante, status |
| `GET /api/reveal?token=` | público, `reveal_token` de 24 bytes | `encrypted_payload` + `iv_b64` |
| `POST /api/groups_draw` | sessão de admin (`requireAdmin`) + `admin_id` no `WHERE` | pares do sorteio, tokens |

## 3. Riscos introduzidos pelo refactor

**Nenhum.** O código foi movido sem alteração. A autorização (`requireAdmin`) continua no endpoint,
antes de chamar `runDraw`, e `runDraw` mantém o filtro `admin_id = ?` (IDOR coberto em dupla camada).

## 4. Achados pré-existentes (fora do escopo deste PR)

| # | Sev. | Achado | Evidência | Impacto | Correção sugerida |
|---|---|---|---|---|---|
| 1 | MÉDIA | A criptografia do nome sorteado não protege contra vazamento do banco: `draw_results` guarda `token_raw` (a chave) ao lado do ciphertext, e `receiver_id` em claro | `lib/handlers/groups_draw.ts` (INSERT draw_results) · `lib/handlers/participants_resend_draw.ts:40` | Quem lê o banco (dump, backup, acesso HostGator) descobre todos os pares | Decidir o modelo de ameaça: se o objetivo é sigilo diante do banco, remover `token_raw` e `receiver_id` (reenvio passa a gerar uma chave nova e cifrar de novo); senão, documentar que a cifra é só "anti-espiada" na UI |
| 2 | BAIXA | Chave de decifragem e `reveal_token` viajam no mesmo link (`&code=`) | `lib/handlers/groups_draw.ts` (revealLink) | Quem tem o link tem tudo; a cifra não acrescenta um segundo fator | Aceitável para amigo secreto; documentar |
| 3 | BAIXA | Sorteio sem transação: uma falha no meio do loop deixa `draw_results` parcial com o grupo ainda `open` | `lib/handlers/groups_draw.ts` (loop de INSERT; nenhum `BEGIN` no backend) | Um novo sorteio duplica linhas de `draw_results` | `pool.getConnection()` + `beginTransaction`/`commit` envolvendo os INSERT/UPDATE |
| 4 | BAIXA | `shuffle` usa `Math.random` | `lib/handlers/groups_draw.ts` (`shuffle`) | Previsibilidade teórica do pareamento | `crypto.randomInt` no Fisher-Yates |
| 5 | BAIXA (observabilidade) | Status HTTP sempre 200 em erro: `res.writeHead(200)` antes de `res.statusCode` | `api/invite.ts`, `api/reveal.ts`, `api/groups_draw.ts`, `api/chat.ts`, `api/groups.ts`, `api/participants.ts` | Logs da Vercel não veem 4xx; o frontend não sente (`frontend/src/lib/api.js:30`) | Usar `setHeader` nos headers de CORS e só depois definir o status (padrão de `api/admin.ts`) |
| 6 | INFO | Sem rate limit em `GET /api/invite` e `/api/reveal` | — | Força bruta inviável (192 bits), só custo/DoS | Rate limit da Vercel/WAF, se necessário |

## 5. Scoring (escopo do refactor)

| Domínio | Peso | Nota |
|---|---|---|
| Segredos & credenciais | 20% | 85 |
| Input validation | 15% | 85 |
| AuthN/AuthZ | 15% | 95 |
| Proteção de dados | 15% | 60 (achado 1) |
| Resiliência | 10% | 65 (achado 3) |
| Monitoramento | 10% | 60 (achado 5) |
| Supply chain | 10% | 85 |
| Compliance | 5% | 80 |
| **Final** | | **~78** |

## 6. Veredito

**Refactor: APROVADO.** Nenhum risco novo e equivalência comprovada.
**Sistema: aprovado com ressalvas.** Os achados 1 e 3 merecem um PR próprio; o achado 1
precisa de uma decisão de produto (que modelo de ameaça a cifra deve cobrir).
