# AmigoSecreto
# (Offline Edition)

Uma aplicação de Amigo Secreto com estética retro-terminal, focada em privacidade, segurança local e facilidade de distribuição via links criptografados.

## 🚀 Funcionalidades da Versão Offline

- **Entrada em Massa**: Interface via `textarea` para colar listas de nomes rapidamente.
- **Algoritmo de Sorteio Seguro**: Garante matematicamente que ninguém tire a si próprio (Não-Reflexividade) e que cada um tenha um par único (Bijetividade).
- **Criptografia Dinâmica**: Cada sorteio gera chaves Base64 exclusivas com *salts* aleatórios.
- **Distribuição Omnichannel**: Tabela de resultados com botões diretos para:
    - **WhatsApp**: Envia mensagem personalizada com o link.
    - **Telegram**: Compartilhamento rápido via API de compartilhamento.
    - **Local**: Link para conferência imediata do organizador.
- **Viewer de Revelação**: Tela de "Olá, [Nome]!" que descriptografa os dados apenas no dispositivo do participante.

---

## 🛠️ Como Executar na Máquina Local

Siga os comandos abaixo para configurar o ambiente e rodar o sistema:

### 1. Preparar o Ambiente
Certifique-se de estar na pasta raiz do projeto e que a pasta `src` contenha o `index.html` e o `storage.js`.

### 2. Compilar o CSS (Tailwind v4)
Para processar os estilos e monitorar alterações, execute:
```bash
npm run dev
npx @tailwindcss/cli -i ./styles.css -o ./dist/output.css --watch
```

### 3. Iniciar o Servidor Local

Em um segundo terminal, rode o comando para servir os arquivos da pasta src:
```bash
npx serve src
```

---

## 📋 Fluxo de Operação

>    Login: Informe o e-mail do organizador (Owner).
>
>    Auth: Insira a chave de segurança padrão: 091205.
>
>    Projeto: Selecione um codinome de filme para o sorteio.
>
>    Membros: Cole os nomes no terminal (um por linha) e clique em Salvar Membros.
>
>    Finalização: Clique em [ FINALIZAR E GERAR LINKS ].
>
>    Distribuição: Clique nos botões de WhatsApp ou Telegram na tabela para disparar os links para os amigos.
>

---

## 🔒 Arquitetura de Segurança

O sistema opera no modelo Zero-Knowledge Server. Isso significa que:
O nome do amigo sorteado não é salvo em texto plano no navegador.

> Os dados estão codificados na URL: ?show=[CÓDIGO_CRIPTOGRAFADO]&hello=[NOME].

A auditoria é feita via drawId e timestamp gerados no momento do sorteio, permitindo ao organizador validar a autenticidade se houver dúvidas.

---

## 📂 Estrutura de Pastas Sugerida
```Plaintext

/
├── src/
│   ├── dist/
│   │   └── output.css      # Gerado pelo Tailwind
│   ├── movieslist.json     # Banco de codinomes
│   ├── storage.js          # Lógica principal
│   ├── styles.css          # Fonte do Tailwind
│   └── index.html          # Interface
├── package.json
└── README.md
```
Nota: Esta é uma versão de uso local e gratuito. A responsabilidade pela integridade do sorteio e distribuição dos links é inteiramente do organizador (Owner).