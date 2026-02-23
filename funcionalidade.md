# Funcionalidades atuais do sistema

## Visao geral
O sistema e um gerenciador de Amigo Secreto com interface web em React (Vite) e backend em PHP com MySQL. O fluxo principal e: informar email do organizador, informar participantes, realizar sorteio, gerar links individuais e revelar o resultado por link.

## Fluxo do usuario (frontend)
- Passo 1: o organizador informa seu email e a sessao e iniciada.
- Passo 2: o organizador insere a lista de participantes (um nome por linha).
- Passo 3: o sistema executa o sorteio e gera um link unico para cada participante.
- Passo 4: cada participante abre seu link e visualiza seu amigo secreto.

## Regras e validacoes no frontend
- Email do organizador e validado por formato basico (precisa conter '@').
- A lista precisa ter no minimo 2 participantes.
- O sorteio evita que a pessoa tire a si mesma; a funcao tenta embaralhar ate 500 vezes.
- O email do organizador e salvo no `localStorage` para manter a sessao no navegador.

## Sorteio e persistencia (backend)
- Endpoint `POST /api/draw.php` recebe `owner_email` e `participants` (array com `name` e `secret_friend_name`).
- O backend cria um grupo (`groups`) e grava os participantes (`participants`) com o nome do amigo secreto.
- Retorna os IDs dos participantes, usados para formar links individuais (ex.: `/?id=123`).

## Revelacao do resultado (backend)
- Endpoint `GET /api/reveal.php?id=ID` valida o ID, busca participante e grupo no banco, checa se o grupo esta ativo e retorna `from` e `to` (quem tirou quem).
- O endpoint marca o participante como `viewed = 1`.

## Banco de dados
- Tabelas: `groups` (email do organizador e status) e `participants` (participantes, amigo secreto e status de visualizacao).
- Relacionamento: `participants.group_id` referencia `groups.id`.

## Interface e experiencia
- UI com estilo de terminal/CRT.
- Indicadores de etapa e mensagens de erro inline.
- Botao de copiar link individual para a area de transferencia.
- Animacoes de revelacao do resultado.

## Integracoes e configuracao
- O frontend exige `VITE_API_BASE_URL` apontando para a API PHP.
- O backend permite configurar CORS via `APP_ORIGIN`.
- Configuracoes de email/IMAP existem no arquivo de config, mas nao ha uso efetivo no fluxo atual.

## O que nao existe hoje
- Envios automaticos de email.
- Autenticacao forte (OTP, login, tokens).
- Painel para gerenciar ou encerrar grupos.
- Regras adicionais de sorteio (ex.: evitar pares especificos).
