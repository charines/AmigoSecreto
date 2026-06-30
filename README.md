# AmigoSecreto

Aplicacao web para gerenciamento de Amigo Secreto com painel admin, convites por token, sorteio com criptografia, revelacao individual e chat anonimo.

## Stack
- Frontend: React 19 + Vite 7 + TailwindCSS 4
- Backend: PHP 8 (endpoints REST por arquivo em `api/`)
- Banco: MySQL 8

## Rotas principais
- `/` -> autenticacao admin e dashboard
- `/invite?token=...` -> confirmacao de convite
- `/reveal?token=...&code=...` -> revelacao do amigo secreto
- `/join?dharma=...` -> entrada por codigo/link
- `/chat?token=...` -> chat anonimo
- `/reset-password?token=...` -> redefinicao de senha admin

## Estrutura
- `src/` -> frontend React
- `api/` -> endpoints PHP
- `database/` -> schema SQL
- `docs/` -> governanca e modulos de arquitetura

## Requisitos
- Node.js 20+
- npm 10+
- PHP 8+
- MySQL 8+

## Configuracao local
1. Instale dependencias do frontend:
```bash
npm install
```
2. Configure variaveis do frontend:
```bash
cp .env.local .env
```
3. Ajuste `VITE_API_BASE_URL` no `.env` para apontar para sua API PHP.
4. Importe o schema no MySQL:
```bash
mysql -u <user> -p <db_name> < database/schema.mysql.sql
```
5. Configure credenciais da API em `api/config.php` (ou via env no servidor).

## Execucao
- Desenvolvimento frontend:
```bash
npm run dev
```
- Build de producao:
```bash
npm run build
```
- Preview local do build:
```bash
npm run preview
```
- Lint:
```bash
npm run lint
```

## Deploy (modelo recomendado)
- Frontend em Netlify/Vercel
- API PHP em hospedagem PHP (ex.: HostGator)
- `VITE_API_BASE_URL` apontando para `https://seu-dominio.com/api`

## Governanca para IA
- Fonte unica: `agent.md`
- Preflight e operacao: `docs/docs_for_llm.md`
- Modulos de dominio: `docs/modules/`
