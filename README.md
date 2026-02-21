Sim — dá para hospedar o React no Netlify e o backend PHP no HostGator sem problema. Não precisa estar tudo no Apache. A melhor sugestão é: Netlify para o front e HostGator para o PHP, com um domínio/subdomínio para a API (ex.: `https://api.seudominio.com`). Assim você mantém o deploy do front simples e o PHP fica no HostGator. Se você quiser tudo no HostGator, pode subir o `dist` no `public_html` e o backend em `public_html/api`, mas não é obrigatório.

Segui com as mudanças que você pediu.

**O que foi feito**
- Supabase removido do front e das dependências.
- Front atualizado para chamar API PHP (`draw.php` e `reveal.php`).
- Backend PHP criado com PDO + CORS.
- `.env` preparado com valor dummy.
- SQL do MySQL já está em `database/schema.mysql.sql`.

**Arquivos principais**
- `api/config.php` (credenciais dummy + CORS)
- `api/db.php`
- `api/cors.php`
- `api/draw.php`
- `api/reveal.php`
- `src/App.jsx`
- `.env`
- `database/schema.mysql.sql`
- `package.json`
- `package-lock.json`

**Como usar no HostGator**
1. Rode o SQL no phpMyAdmin: `database/schema.mysql.sql`.
2. Suba a pasta `api` para `public_html/api` no HostGator.
3. Configure as variáveis no HostGator ou edite `api/config.php` diretamente:
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`
   - `APP_ORIGIN` com o domínio do Netlify (ex.: `https://seu-site.netlify.app`)
4. No Netlify, configure `VITE_API_BASE_URL` apontando para `https://seu-dominio.com/api`.
5. Rebuild do site no Netlify.

**Observações**
- `.env` do Vite é público no build. Não coloque senha de banco nele.
- A autenticação foi simplificada: apenas e-mail e segue, sem OTP.
- `npm install` foi executado para atualizar o `package-lock.json` (isso também mexeu em `node_modules/`).

Se quiser, posso:
1. Ajustar o CORS para um domínio específico.
2. Adicionar envio de e-mail via HostGator.
3. Criar um endpoint de “listar sorteios” ou “encerrar grupo”.

Me confirma o domínio final do Netlify e se prefere configurar as variáveis no HostGator via `.htaccess` ou editando `api/config.php`.