---
module: funcionalidades
domain: SA-01 (Portaria) + SA-02 (Orquestrador) + SA-03 (O Juiz) + SA-04 (A Sombra)
status: canonical — estado atual em producao
moved_from: funcionalidade.md
last_updated: 2026-06-30
---

# Funcionalidades atuais do sistema

## Visao geral
O sistema e uma plataforma de Amigo Secreto com painel administrativo autenticado, convites por token, confirmacao de participantes, sorteio com criptografia, revelacao individual por link e chat anonimo.

## Rotas de usuario
- `/`: login/admin + dashboard de grupos.
- `/invite?token=`: confirmacao de convite.
- `/reveal?token=&code=`: revelacao do amigo secreto.
- `/join?dharma=`: entrada no grupo por codigo/link.
- `/chat?token=`: chat anonimo entre participantes.
- `/reset-password?token=`: redefinicao de senha de admin.

## Fluxo administrativo (SA-01 + SA-02)
- Admin autentica por sessao com cookie (`admin_login.php`, `admin_me.php`, `admin_logout.php`).
- Admin cria grupo, adiciona participantes e dispara convites.
- Convites sao enviados por email com token unico por participante.
- Dashboard exibe progresso por status: `invited`, `link_clicked`, `confirmed`, `token_sent`, `revealed`.

## Fluxo de sorteio e revelacao (SA-03)
- Sorteio ocorre no backend (`groups_draw.php`) para participantes `confirmed`.
- O nome sorteado e criptografado com AES-256-GCM e chave derivada de token unico.
- Participante recebe link de revelacao e codigo de acesso.
- Frontend decripta localmente via Web Crypto (`src/lib/crypto.js`).
- Backend confirma visualizacao (`reveal_confirm.php`) e atualiza status.

## Fluxo de chat anonimo (SA-04)
- Participante acessa `/chat?token=`.
- Frontend faz polling (`chat_get.php`) e envio (`chat_send.php`).
- Interface exibe remetente como anonimo.

## Persistencia e infraestrutura
- Banco MySQL com tabelas para admins, grupos, participantes, resultados de sorteio e mensagens.
- Frontend usa `VITE_API_BASE_URL`.
- Backend usa CORS configuravel e SMTP/IMAP para envio de mensagens.

## O que nao existe hoje
- Regra de exclusao de pares (ex.: casal nao pode se tirar).
- Suite de testes automatizados ampla (ha scripts pontuais, sem gate unico de testes).
- Rate limiting dedicado para endpoints publicos.
