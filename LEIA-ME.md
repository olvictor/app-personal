# Prancheta

App do personal e dos alunos. Um endereço na internet que vira ícone no
celular — Android e iPhone, sem loja de apps.

- **Personal:** cadastra alunos, cria o acesso deles, registra avaliação
  física, monta as fichas de treino e organiza a agenda da semana.
- **Aluno:** entra com o celular, vê o treino do dia, marca cada série e
  acompanha a evolução.

Feito com React + Vite (PWA) e Supabase (banco Postgres + login).

---

## O que você precisa antes de começar

1. **Node.js 18 ou mais novo** — https://nodejs.org
2. **Uma conta no Supabase** (grátis) — https://supabase.com

---

## Passo 1 — criar o projeto no Supabase

1. Entre no Supabase e clique em **New project**.
2. Dê um nome (ex.: `prancheta`), escolha uma senha para o banco e a região
   **South America (São Paulo)**.
3. Espere uns dois minutos até o projeto ficar pronto.

## Passo 2 — criar as tabelas

1. No menu lateral, abra **SQL Editor** › **New query**.
2. Abra o arquivo `supabase/schema.sql` deste projeto, copie o conteúdo
   inteiro, cole no editor e clique em **Run**.
3. Deve aparecer "Success. No rows returned". Pronto: as tabelas, as regras
   de acesso e o catálogo inicial de exercícios estão no ar.

## Passo 3 — desligar a confirmação por e-mail

O aluno entra com celular, não com e-mail de verdade. Então:

1. Vá em **Authentication** › **Sign In / Providers** › **Email**.
2. Desmarque **Confirm email** e salve.

## Passo 4 — publicar a função que cria o acesso do aluno

Essa função é o que gera a senha de 6 dígitos. Ela precisa rodar no servidor,
porque só lá existe a chave que pode criar contas.

```bash
npm install -g supabase          # uma vez só, na sua máquina
supabase login
supabase link --project-ref SEU_REF   # o REF está na URL do painel
supabase functions deploy criar-acesso
```

> Se preferir não instalar nada agora, dá para publicar a função pelo painel
> do Supabase em **Edge Functions** › **Deploy a new function**, colando o
> conteúdo de `supabase/functions/criar-acesso/index.ts`.

## Passo 5 — ligar o app ao banco

1. No painel do Supabase, vá em **Project Settings** › **API**.
2. Copie o **Project URL** e a chave **anon public**.
3. Na pasta do projeto, copie `.env.example` para `.env` e preencha:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_DOMINIO_INTERNO=alunos.prancheta.local
```

> `VITE_DOMINIO_INTERNO` tem que ser igual ao `DOMINIO_INTERNO` que está na
> primeira linha da função `criar-acesso`. Não é um e-mail de verdade: serve
> para o celular do aluno virar o identificador da conta.

## Passo 6 — rodar

```bash
npm install
npm run dev
```

Abra o endereço que aparecer (algo como `http://localhost:5173`).

1. Clique em **Sou o personal** › **Criar conta de personal**.
2. Cadastre-se com seu e-mail e senha — essa é a sua conta.
3. Cadastre um aluno de teste com o **seu próprio celular**, envie o acesso
   e entre como aluno em outro navegador (ou aba anônima) para ver os dois
   lados funcionando.

---

## Colocar no ar (para os alunos usarem)

Qualquer hospedagem de site estático serve. A mais simples:

```bash
npm install -g vercel
vercel            # responda as perguntas; na primeira vez ele cria o projeto
vercel --prod
```

Depois, no painel da Vercel, em **Settings › Environment Variables**, repita
as três variáveis do `.env`. Sem elas o app sobe, mas não conversa com o
banco.

O endereço que a Vercel te der (ou seu próprio domínio, configurado em
**Settings › Domains**) é o link que você manda no WhatsApp.

> **Escolha o endereço antes de mandar para os alunos.** Trocar depois obriga
> todo mundo a instalar de novo.

---

## Como o aluno instala

- **Android:** o Chrome oferece sozinho, num aviso embaixo. Se ele fechar o
  aviso: menu de três pontinhos › **Adicionar à tela de início**.
- **iPhone:** só pelo Safari. Botão de compartilhar › **Adicionar à Tela de
  Início**. Se o aluno abrir o link dentro do WhatsApp, a opção não aparece —
  ele precisa tocar em "abrir no Safari" antes.

O app já manda essa explicação junto na mensagem do WhatsApp.

---

## Como a segurança funciona

Não é o app que decide quem vê o quê — é o banco, em cada linha
(Row Level Security):

- Cada aluno carrega o `personal_id` de quem o cadastrou. Um personal só
  enxerga linhas com o próprio id.
- O aluno enxerga apenas os próprios treinos, avaliações e sessões.
- Só o personal cria contas de aluno, e isso acontece na função do servidor,
  nunca no celular. A chave que cria contas nunca sai do Supabase.
- A senha provisória é guardada só como hash. Se o personal perder a
  mensagem, ele gera outra — a antiga deixa de valer.

---

## Mapa dos arquivos

```
supabase/schema.sql                 banco: tabelas, regras de acesso, catálogo
supabase/functions/criar-acesso/    cria o login do aluno (roda no servidor)
src/lib/supabase.ts                 conexão e formatação de celular
src/lib/sessao.tsx                  descobre se quem entrou é personal ou aluno
src/lib/fila.ts                     séries marcadas sem internet
src/telas/Entrar.tsx                login (aluno e personal) e cadastro
src/telas/TrocarSenha.tsx           primeiro acesso do aluno
src/telas/personal/                 alunos, cadastro, ficha, avaliação, treino, agenda
src/telas/aluno/                    hoje, execução, evolução, perfil
src/ui.tsx                          peças de tela reaproveitadas e o gráfico
src/estilos.css                     cores, tipografia e espaçamento
```

---

## O que ficou para depois

Mensalidade e pagamento, vídeo do exercício, chat dentro do app, lembrete
automático de sessão, e exportar a ficha em PDF. Nada disso está no banco
ainda — quando entrar, entra como tabela nova, sem mexer no que já existe.
