# Marinho Imóveis — site e painel administrativo

Site de venda e aluguel de imóveis com painel para o dono cadastrar tudo sozinho.

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4
- **Supabase**: banco Postgres, login do admin e armazenamento das fotos
- Deploy na **Vercel**

> Em construção. Já prontos: identidade visual, banco de dados, painel com equipe (dono e corretor), site público e WhatsApp.
> Próxima etapa: SEO (Open Graph, sitemap, dados estruturados), política de privacidade, aviso de cookies e acabamento.
>
> **Vai entregar para o cliente?** Siga o [checklist de entrega](docs/ENTREGA.md). O [manual do cliente](docs/MANUAL-DO-CLIENTE.md) explica o painel em linguagem simples.

---

## 1. Criar o projeto no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e clique em **New project**.
   - **Region:** South America (São Paulo), para o site ficar mais rápido no Brasil.
   - Guarde a senha do banco num lugar seguro.
2. Com o projeto criado, vá em **Project Settings → API Keys** e copie:
   - **Project URL**
   - **Publishable key** (`sb_publishable_...`)
   - **Secret key** (`sb_secret_...`)
3. Na pasta do projeto, copie o `.env.example` para `.env.local` e preencha:

   ```bash
   cp .env.example .env.local
   ```

   | Variável | Onde pegar |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
   | `SUPABASE_SECRET_KEY` | Secret key. Usada pelos scripts e, no servidor, pela tela **Equipe** (criar e remover acessos). Nunca vai para o navegador. |
   | `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` no seu computador. Na Vercel, use o domínio do site. |

   Projetos antigos do Supabase mostram as chaves `anon` e `service_role`. Elas também funcionam: use a `anon` no lugar da publishable e a `service_role` no lugar da secret.

## 2. Rodar as migrations (criar as tabelas)

As migrations ficam em `supabase/migrations/` e precisam rodar **na ordem**:

1. `20261009000100_schema.sql` — tabelas
2. `20261009000200_security.sql` — regras de acesso e bucket de fotos
3. `20261009000300_property_images_sync.sql` — salvar fotos (ordem e capa)
4. `20261009000400_search.sql` — busca sem acento
5. `20261010000500_team_roles.sql` — equipe do painel com papéis (dono e corretor)

**Opção A, pelo painel do Supabase (mais simples):**

Abra **SQL Editor → New query**, cole todo o conteúdo do primeiro arquivo e clique em **Run**. Repita com os outros, um de cada vez, na ordem acima.

**Opção B, pela linha de comando:**

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF   # o "ref" é o código na URL do projeto
npx supabase db push
```

O que as migrations criam:

| Tabela | Para que serve |
|---|---|
| `properties` | Imóveis. O código (`MI-0001`) e o endereço da página (slug) são gerados automaticamente. |
| `property_images` | Fotos de cada imóvel, com ordem e capa |
| `settings` | Dados de contato do site: WhatsApp, telefone, e-mail, endereço, redes sociais e texto "Sobre" |
| `admins` | Equipe do painel: nome, e-mail e papel (dono ou corretor) |

Também criam o bucket de fotos `property-images` e as regras de segurança (RLS):

- **Visitantes** veem só os imóveis marcados como visíveis, as fotos deles e as configurações.
- **Equipe** (contas listadas em `admins`) cadastra, edita, apaga imóveis e envia fotos.
- **Só o dono** altera as configurações do site e a equipe. O banco não deixa remover nem rebaixar o último dono.

## 3. Desligar o cadastro público

O painel não tem tela de cadastro. Mesmo assim, desligue a criação de contas no Supabase:

**Authentication → Sign In / Providers → desmarque "Allow new users to sign up" → Save.**

Se isso ficar ligado por engano, uma conta nova ainda **não** consegue mexer em nada, porque só quem está na tabela `admins` tem acesso.

## 4. Criar o primeiro acesso (dono)

```bash
npm install
npm run admin:criar -- dono@marinhoimoveis.com.br "uma-senha-forte" "Nome do dono"
```

O comando cria o usuário já confirmado, com acesso de **dono**. As outras pessoas são adicionadas pelo próprio painel, em **Equipe**. Se o dono perder o acesso a todas as contas de e-mail, rode o mesmo comando com uma senha nova.

**Sem usar o terminal:**

1. Vá em **Authentication → Users → Add user → Create new user**, informe e-mail e senha e marque **Auto Confirm User**.
2. No **SQL Editor**, rode:

   ```sql
   insert into public.admins (user_id, email, role)
   select id, email, 'dono' from auth.users where email = 'dono@marinhoimoveis.com.br';
   ```

## 5. Popular com imóveis de exemplo (opcional)

```bash
npm run seed
```

O seed cadastra os dados de contato da Marinho e 6 imóveis reais do site antigo (3 para aluguel e 3 à venda), com fotos. Ele só roda com a tabela de imóveis vazia.

## 6. Rodar no computador

```bash
npm run dev
```

- Site: http://localhost:3000
- Painel: http://localhost:3000/admin

## Como usar o painel

Entre em `/admin` com o e-mail e a senha do administrador.

- **Visão geral:** totais de imóveis e os últimos atualizados.
- **Imóveis:** busca por código, título ou bairro (sem precisar de acento) e filtros por negócio, situação e visibilidade. No menu ⋮ de cada imóvel: duplicar, ocultar/mostrar no site, ver no site e excluir.
- **Novo imóvel / Editar:**
  1. Escolha **Aluguel** ou **Venda**. Os campos de valor aparecem conforme a escolha, e no aluguel o total mensal é calculado na hora.
  2. Digite o CEP para preencher o endereço.
  3. Adicione as fotos: no celular, **Tirar foto** abre a câmera. As fotos são comprimidas antes do envio. Arraste para mudar a ordem (no celular, segure a foto antes) e use a estrela para escolher a capa.
  4. Clique em **Cadastrar imóvel** ou **Salvar alterações**. Nada é gravado antes disso, e o site é atualizado na hora.
- **Duplicar** cria uma cópia com as mesmas fotos, **oculta** do site até ser revisada.
- **Configurações** (só dono): WhatsApp (com botão para testar), telefone, e-mail, endereço, CRECI, horário, redes sociais e texto "Sobre".
- **Equipe** (só dono): adicionar pessoas como **Dono** (faz tudo) ou **Corretor** (só imóveis e fotos), trocar o acesso, remover e enviar link para a pessoa criar uma senha nova. A pessoa entra com uma **senha provisória** que o dono define, ou por **convite no e-mail**.
- **Minha conta:** cada pessoa troca o próprio nome e a própria senha.
- **Esqueci minha senha:** na tela de login. Manda um link por e-mail para criar uma senha nova.

## E-mails do painel (convite e senha)

O convite e o "Esqueci minha senha" mandam e-mails pelo Supabase. Configure três coisas antes de entregar.

**1. Endereços permitidos.** Em **Authentication → URL Configuration**:
- **Site URL:** o domínio final, por exemplo `https://www.marinhoimoveis.com.br`.
- **Redirect URLs:** adicione `https://www.marinhoimoveis.com.br/auth/confirm` e `http://localhost:3000/auth/confirm`.

**2. Modelos dos e-mails.** Em **Authentication → Emails → Templates**:

*Invite user*, assunto `Seu acesso ao painel da Marinho Imóveis`:

```html
<h2>Você foi convidado para o painel da Marinho Imóveis</h2>
<p>Clique para criar sua senha. O link vale por pouco tempo.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/admin/definir-senha">Criar minha senha</a></p>
```

*Reset password*, assunto `Crie uma senha nova — Marinho Imóveis`:

```html
<h2>Criar uma senha nova</h2>
<p>Recebemos um pedido para criar uma senha nova para o painel. Se não foi você, ignore este e-mail.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/definir-senha">Criar senha nova</a></p>
```

Com esses modelos, o link funciona em qualquer celular ou computador. Os modelos padrão também funcionam (a página `/auth/sessao` cuida deles), mas é melhor trocar.

**3. Serviço de e-mail próprio.** O e-mail padrão do Supabase serve só para testes: tem limite baixo de envios e pode nem entregar fora da sua equipe. Crie uma conta num serviço como [Resend](https://resend.com) ou [Brevo](https://www.brevo.com) (os dois têm plano gratuito), verifique o domínio `marinhoimoveis.com.br` e preencha **Authentication → Emails → SMTP Settings**.

Sem o serviço de e-mail, a equipe continua funcionando com a opção **senha provisória**.

## Fotos decorativas do site

O topo da página inicial, a seção "Mais que uma casa" e a faixa final usam fotos do Unsplash (licença gratuita para uso comercial), listadas em `public/images/CREDITOS.md`. Para usar fotos próprias, substitua os arquivos em `public/images/` mantendo os mesmos nomes.

## 7. Publicar na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e importe o repositório.
3. Em **Environment Variables**, cadastre:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`: o domínio final, por exemplo `https://www.marinhoimoveis.com.br`
   - `SUPABASE_SECRET_KEY`: necessária para a tela **Equipe**. Fica só no servidor. **Nunca** use o prefixo `NEXT_PUBLIC_` nela.
4. Clique em **Deploy**.
5. Para usar o domínio próprio: **Settings → Domains** na Vercel, depois aponte o DNS conforme as instruções que aparecerem.
6. No Supabase, configure os e-mails do painel (seção "E-mails do painel" acima).
7. **Plano:** o plano gratuito da Vercel é só para uso pessoal, e um site de imobiliária é uso comercial, então o cliente precisa do plano Pro. Detalhes em [docs/ENTREGA.md](docs/ENTREGA.md).

---

## Estrutura do projeto

```
app/
  (site)/           site público: home, alugar/, comprar/, imovel/[slug]/, sobre/, contato/
  admin/
    login/           tela de login do painel
    (painel)/        painel: visão geral, imoveis/, equipe/, conta/, configuracoes/ (protegidas)
    recuperar-senha/ esqueci minha senha (aberta)
    definir-senha/   criar senha pelo link do e-mail
    actions.ts       entrar e sair
    sair/            encerra a sessão de contas sem permissão
  auth/confirm/      destino dos links de convite e de senha
components/admin/   formulário do imóvel, fotos, filtros e demais peças do painel
components/site/    logo, cabeçalho, rodapé, cards, galeria, filtros e WhatsApp do site
lib/
  admin/             consultas do painel
  public/            consultas do site (com cache) e filtros da listagem
  whatsapp.ts        links e mensagens do WhatsApp
  validation/        regras de validação (imóvel e configurações)
  auth.ts            requireAdmin() / requireOwner(): checagem de acesso e papel (dono ou corretor)
  supabase/          clientes do Supabase (servidor, navegador, público e admin com a chave secreta)
  database.types.ts  tipos das tabelas
proxy.ts             protege as rotas /admin e renova a sessão
supabase/
  migrations/        SQL do banco (tabelas, RLS e Storage)
  seed/images/       fotos dos imóveis de exemplo
scripts/
  create-admin.mjs   npm run admin:criar
  seed.mjs           npm run seed
IDENTIDADE.md        identidade visual e dados da empresa
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Roda o site no computador |
| `npm run build` | Gera a versão de produção |
| `npm run lint` | Verifica o código |
| `npm run typecheck` | Verifica os tipos do TypeScript |
| `npm run admin:criar -- email "senha" "Nome"` | Cria o dono (ou troca a senha dele) |
| `npm run seed` | Cadastra os imóveis de exemplo |
