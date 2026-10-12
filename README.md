# Marinho Imóveis — site e painel administrativo

Site de venda e aluguel de imóveis com painel para o dono cadastrar tudo sozinho.
Roda **de graça e sem cartão de crédito**: o único custo é o domínio (Registro.br, cerca de R$ 40 por ano).

- **Next.js 16** + TypeScript + Tailwind CSS 4, gerado como **páginas prontas** (sem servidor)
- **Supabase** (plano grátis): banco Postgres, login da equipe e o arquivo original das fotos (Storage)
- **Cloudflare** (plano grátis): hospedagem do site e das fotos, e o serviço do painel
- **GitHub Actions** (grátis): gera e publica o site sempre que o painel salva algo

> Em construção. Já prontos: identidade visual, banco de dados, painel com equipe (dono e corretor), site público, WhatsApp e hospedagem grátis.
> Próxima etapa: SEO (Open Graph, sitemap, dados estruturados), política de privacidade, aviso de cookies e acabamento.
>
> **Vai entregar para o cliente?** Siga o [checklist de entrega](docs/ENTREGA.md). O [manual do cliente](docs/MANUAL-DO-CLIENTE.md) explica o painel em linguagem simples.

---

## Como funciona

```
Visitante ──► Cloudflare: páginas prontas + fotos            sem limite de visitas, não toca no banco

Painel (no navegador) ──► Supabase: lê e grava imóveis        regras de acesso no banco (RLS)
                      └─► Cloudflare /api: fotos, equipe, publicar

Salvou no painel ──► GitHub Actions gera as páginas de novo, copia as fotos
                      novas do Supabase para dentro do site ──► Cloudflare   (uns 3 minutos)

Todo dia, 3h ──► manutenção: mantém o banco ativo, apaga fotos de vendidos/alugados
                 há mais de 30 dias e fotos soltas; aos domingos, backup do banco
```

Por que assim: os visitantes só recebem arquivos prontos, e a Cloudflare entrega arquivos do site de graça e sem limite. As fotos são guardadas no Storage do Supabase, mas na publicação as fotos dos imóveis anunciados viram arquivos do próprio site (`/fotos/...`, pelo `scripts/baixar-fotos.mjs`). Assim, visitante nenhum gasta cota do Supabase. As fotos já copiadas ficam guardadas no GitHub (cache), então cada foto sai do Supabase uma vez só.

## Limites do plano grátis (e por que não preocupam)

| Serviço | Limite | Uso esperado |
|---|---|---|
| Cloudflare: páginas e fotos | Visitas ilimitadas | Páginas e fotos são arquivos do site |
| Cloudflare: arquivos por publicação | 20 mil | Cerca de 9 mil fotos anunciadas ao mesmo tempo (cada foto tem 2 arquivos) |
| Cloudflare: serviço do painel | 100 mil pedidos por dia | Só a equipe usa (equipe e publicar) |
| Supabase: fotos (Storage) | 1 GB guardado | Cerca de 3.500 fotos (grande e pequena, comprimidas no celular). As de imóveis vendidos ou alugados são apagadas 30 dias depois |
| Supabase: tráfego | 5 GB por mês | Os visitantes não usam: só a publicação (fotos novas) e o painel |
| Supabase: banco | 500 MB; pausa após 7 dias parado | Texto ocupa pouco; a manutenção diária mantém o banco ativo |
| GitHub Actions | 2.000 minutos por mês (repositório privado); 10 GB de cache | Cada publicação leva 2 a 3 minutos: cerca de 600 por mês. O cache guarda as fotos já copiadas |

Nenhum plano grátis tem garantia eterna. Se um dia algum serviço mudar as regras, dá para trocar só aquela parte.

---

## 1. Criar o projeto no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e clique em **New project**.
   - **Region:** South America (São Paulo), para o painel ficar rápido no Brasil.
   - Guarde a senha do banco num lugar seguro.
2. Com o projeto criado, vá em **Project Settings → API Keys** e copie:
   - **Project URL**
   - **Publishable key** (`sb_publishable_...`)
   - **Secret key** (`sb_secret_...`)

   Projetos antigos do Supabase mostram as chaves `anon` e `service_role`. Elas também funcionam: use a `anon` no lugar da publishable e a `service_role` no lugar da secret.

3. Na pasta do projeto, copie o `.env.example` para `.env.local` e preencha (serve para os comandos no seu computador):

   ```bash
   cp .env.example .env.local
   ```

## 2. Rodar as migrations (criar as tabelas)

As migrations ficam em `supabase/migrations/` e precisam rodar **na ordem**:

1. `20261009000100_schema.sql` — tabelas
2. `20261009000200_security.sql` — regras de acesso
3. `20261009000300_property_images_sync.sql` — salvar fotos (ordem e capa)
4. `20261009000400_search.sql` — busca sem acento
5. `20261010000500_team_roles.sql` — equipe do painel com papéis (dono e corretor)
6. `20261011000600_site_estatico.sql` — dados do site para as páginas prontas e limpeza de fotos

**Opção A, pelo painel do Supabase (mais simples):** abra **SQL Editor → New query**, cole todo o conteúdo do primeiro arquivo e clique em **Run**. Repita com os outros, um de cada vez, na ordem.

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
| `property_images` | Fotos de cada imóvel: caminho no Storage, ordem e capa |
| `settings` | Dados de contato do site: WhatsApp, telefone, e-mail, endereço, redes sociais e texto "Sobre" |
| `admins` | Equipe do painel: nome, e-mail e papel (dono ou corretor) |

Regras de segurança (RLS):

- **Visitantes** não leem as tabelas. O site é gerado pela função `site_snapshot()`, que entrega só os imóveis anunciados (visíveis, disponíveis ou reservados) e nunca o número, o complemento e o CEP quando o imóvel está com "ocultar número".
- **Equipe** (contas listadas em `admins`) cadastra, edita e apaga imóveis e fotos.
- **Só o dono** altera as configurações do site e a equipe. O banco não deixa remover nem rebaixar o último dono.

Também criam dois buckets no Storage: `property-images` (fotos, públicas para ver; só a equipe envia e apaga) e `backups` (privado, só a chave secreta acessa).

## 3. Desligar o cadastro público

O painel não tem tela de cadastro. Mesmo assim, desligue a criação de contas no Supabase:

**Authentication → Sign In / Providers → desmarque "Allow new users to sign up" → Save.**

Ou, pelo terminal: `npx supabase link --project-ref SEU_PROJECT_REF` e `npx supabase config push`. O arquivo `supabase/config.toml` já desliga o cadastro e registra o endereço do site e os endereços dos links de e-mail (atualize os endereços quando trocar o domínio).

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

## 5. Conta na Cloudflare

1. Crie uma conta grátis em [dash.cloudflare.com](https://dash.cloudflare.com).
2. **Account ID:** aparece na página inicial da conta (menu lateral, ou em **Workers & Pages**, no canto direito). Copie.
3. **Token da API:** em **My Profile → API Tokens → Create Token**, use o modelo **Edit Cloudflare Workers** e escolha a conta. Copie o token.

## 6. Configurar a publicação no GitHub

O site é gerado pela GitHub (aba **Actions**), no workflow `.github/workflows/publicar.yml`.

**Token para o painel pedir a publicação:** em [github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens) → **Generate new token** (fine-grained):
- **Repository access:** só este repositório
- **Permissions → Actions:** Read and write
- **Expiration:** sem expiração, se a opção aparecer (se não, o maior prazo, e anote para renovar). A manutenção diária usa o token todo dia, então a GitHub não o desativa por falta de uso.

No repositório, em **Settings → Secrets and variables → Actions**:

| Tipo | Nome | Valor |
|---|---|---|
| Secret | `CLOUDFLARE_API_TOKEN` | Token da Cloudflare (passo 5) |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Account ID da Cloudflare |
| Secret | `SUPABASE_URL` | Project URL do Supabase |
| Secret | `SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| Secret | `SUPABASE_SECRET_KEY` | Secret key. Vai só para o serviço do painel na Cloudflare, nunca para o navegador |
| Secret | `PUBLICAR_TOKEN` | Token da GitHub acima |
| Variable | `SITE_URL` | Endereço do site, sem barra no final. No começo, o da Cloudflare (passo 7); depois, o domínio |

## 7. Primeira publicação

1. Na aba **Actions**, abra **Publicar o site → Run workflow**. Também roda sozinho a cada envio de código para a `main`.
2. Em 2 a 3 minutos o site está no ar em `https://marinho-imoveis.SUA-CONTA.workers.dev` (o endereço aparece no fim do passo "Publicar na Cloudflare").
3. Cadastre esse endereço na variável `SITE_URL` e rode a publicação de novo, para os links do WhatsApp apontarem para o lugar certo.

A partir daí, **salvar no painel já publica**: o topo do painel mostra "Atualizando o site…" e depois "Site atualizado".

## 8. Popular com imóveis de exemplo (opcional)

```bash
npm run seed
```

O seed envia as fotos para o Storage do Supabase e cadastra os dados de contato da Marinho e 6 imóveis reais do site antigo (3 para aluguel e 3 à venda). Ele só roda com a tabela de imóveis vazia. Depois, publique o site (passo 7).

## 9. Domínio próprio

1. Na Cloudflare, **Add a domain** → `marinhoimoveis.com.br` → plano **Free**.
2. No [Registro.br](https://registro.br), troque os servidores DNS pelos dois que a Cloudflare mostrar. Leva de minutos a algumas horas.
3. **Site:** em **Workers & Pages → marinho-imoveis → Settings → Domains & Routes → Add → Custom domain**, adicione `www.marinhoimoveis.com.br` e `marinhoimoveis.com.br`.
4. No GitHub, atualize a variável `SITE_URL` (`https://www.marinhoimoveis.com.br`) e rode a publicação.
5. No Supabase, atualize os endereços dos e-mails (próxima seção).

## E-mails do painel (convite e senha)

O convite e o "Esqueci minha senha" mandam e-mails pelo Supabase. Configure três coisas antes de entregar.

**1. Endereços permitidos.** Em **Authentication → URL Configuration**:
- **Site URL:** o endereço do site, por exemplo `https://www.marinhoimoveis.com.br`.
- **Redirect URLs:** adicione `https://www.marinhoimoveis.com.br/auth/confirm` e `http://localhost:8787/auth/confirm`.

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

Com esses modelos, o link funciona em qualquer celular ou computador. Os modelos padrão também funcionam, mas é melhor trocar. No plano grátis, o Supabase só deixa trocar os modelos depois de configurar o serviço de e-mail próprio (item 3). Os modelos já estão prontos em `supabase/templates/`: com o SMTP configurado, tire o `#` das linhas dos modelos no `supabase/config.toml` e rode `npx supabase config push`.

**3. Serviço de e-mail próprio.** O e-mail padrão do Supabase serve só para testes: tem limite baixo de envios e pode nem entregar fora da sua equipe. Crie uma conta num serviço como [Resend](https://resend.com) ou [Brevo](https://www.brevo.com) (os dois têm plano gratuito), verifique o domínio `marinhoimoveis.com.br` e preencha **Authentication → Emails → SMTP Settings**.

Sem o serviço de e-mail, a equipe continua funcionando com a opção **senha provisória**.

## Rodar no computador

**Como vai ficar publicado (recomendado):** gera as páginas e roda o site, o painel e o serviço juntos.

```bash
cp .dev.vars.example .dev.vars   # configuração do serviço do painel (mesmos dados do Supabase)
npm run preview
```

- Site: http://localhost:8787
- Painel: http://localhost:8787/admin

O painel usa o Supabase do `.env.local` (de preferência um projeto de testes, separado do de produção). A manutenção diária pode ser testada em `http://localhost:8787/cdn-cgi/handler/scheduled?cron=0+6+*+*+*`.

**Mexendo no visual:** `npm run dev` abre o site em http://localhost:3000 e atualiza a cada alteração. O painel precisa do serviço rodando junto: num segundo terminal, `npx wrangler dev`, com `DEV_ORIGIN=http://localhost:3000` no `.dev.vars` e `NEXT_PUBLIC_API_URL=http://localhost:8787` no `.env.local`.

## Como usar o painel

Entre em `/admin` com o e-mail e a senha da equipe.

- **Visão geral:** totais de imóveis e os últimos atualizados. No topo, a situação da publicação do site.
- **Imóveis:** busca por código, título ou bairro (sem precisar de acento) e filtros por negócio, situação e visibilidade. No menu ⋮ de cada imóvel: duplicar, ocultar/mostrar no site, ver no site e excluir.
- **Novo imóvel / Editar:**
  1. Escolha **Aluguel** ou **Venda**. Os campos de valor aparecem conforme a escolha, e no aluguel o total mensal é calculado na hora.
  2. Digite o CEP para preencher o endereço.
  3. Adicione as fotos: no celular, **Tirar foto** abre a câmera. Cada foto é comprimida no aparelho (1600 px) e enviada em duas versões (grande e pequena). Arraste para mudar a ordem (no celular, segure a foto antes) e use a estrela para escolher a capa.
  4. Clique em **Cadastrar imóvel** ou **Salvar alterações**. Nada é gravado antes disso. O site mostra a mudança em uns 3 minutos.
- **Vendido ou alugado:** ao mudar a situação, o anúncio sai do site na próxima publicação. As fotos continuam guardadas por 30 dias (caso o negócio desande) e depois são apagadas sozinhas. O imóvel continua no painel.
- **Duplicar** cria uma cópia com as mesmas fotos, **oculta** do site até ser revisada.
- **Configurações** (só dono): WhatsApp (com botão para testar), telefone, e-mail, endereço, CRECI, horário, redes sociais e texto "Sobre".
- **Equipe** (só dono): adicionar pessoas como **Dono** (faz tudo) ou **Corretor** (só imóveis e fotos), trocar o acesso, remover e enviar link para a pessoa criar uma senha nova. A pessoa entra com uma **senha provisória** que o dono define, ou por **convite no e-mail**.
- **Minha conta:** cada pessoa troca o próprio nome e a própria senha.
- **Esqueci minha senha:** na tela de login. Manda um link por e-mail para criar uma senha nova.

## Backup

Todo domingo, a manutenção grava uma cópia do banco (imóveis, fotos, configurações e equipe) no bucket privado `backups` do Storage, em `banco/AAAA-MM-DD.json`, e guarda as 12 últimas. As fotos em si ficam no bucket `property-images`.

Para restaurar num banco novo (migrations já rodadas): baixe o arquivo em **Storage → backups** no painel do Supabase, rode `npm run backup:restaurar -- caminho/do/arquivo.json` e siga a instrução que aparece no fim. A equipe não é restaurada: crie o dono com `npm run admin:criar` e adicione o resto pelo painel.

## Se algo der errado

| Problema | O que fazer |
|---|---|
| O topo do painel mostra "O site não atualizou" | Na aba **Actions** do GitHub, abra a última execução de **Publicar o site** e veja o passo com erro. Depois de corrigir, rode de novo |
| Salvar não publica ("publicação automática ainda não foi configurada") | Falta o `PUBLICAR_TOKEN` no GitHub, ou ele expirou. Gere outro (passo 6) e rode a publicação |
| A tela Equipe avisa que falta configurar o serviço | Falta o secret `SUPABASE_SECRET_KEY` no GitHub. Cadastre e rode a publicação |
| O painel não abre ("Não foi possível abrir o painel") | O projeto do Supabase pode estar pausado. Reative no painel do Supabase; a manutenção diária evita que aconteça de novo |

## Fotos decorativas do site

O topo da página inicial, a seção "Mais que uma casa" e a faixa final usam fotos do Unsplash (licença gratuita para uso comercial), listadas em `public/images/CREDITOS.md`. Para usar fotos próprias, substitua os arquivos em `public/images/` mantendo os mesmos nomes.

---

## Estrutura do projeto

```
app/
  (site)/            site público: home, alugar/, comprar/, imovel/[slug]/, imovel/404/, sobre/, contato/
  admin/
    login/           tela de entrada do painel
    (painel)/        painel: visão geral, imoveis/ (novo, editar?id=), equipe/, conta/, configuracoes/
    recuperar-senha/ esqueci minha senha
    definir-senha/   criar senha pelo link do e-mail
    sair/            encerra a sessão
  auth/confirm/      destino dos links de convite e de senha
components/admin/    formulário do imóvel, fotos, filtros, sessão e demais peças do painel
components/site/     logo, cabeçalho, rodapé, cards, galeria, filtros e WhatsApp do site
lib/
  admin/api.ts       dados e ações do painel (no navegador, com RLS) e chamadas ao /api
  public/            dados do site (lidos na publicação) e filtros da listagem
  photos.ts          caminhos e endereços das fotos (grande e pequena)
  whatsapp.ts        links e mensagens do WhatsApp
  validation/        regras de validação (imóvel, configurações e equipe)
  supabase/          clientes do Supabase (navegador e publicação)
  database.types.ts  tipos das tabelas
worker/index.ts      serviço na Cloudflare: páginas, /fotos, /api e manutenção diária
wrangler.jsonc       configuração da Cloudflare (páginas, rotas e horário da manutenção)
.github/workflows/   publicar.yml: gera e publica o site
supabase/
  migrations/        SQL do banco (tabelas, RLS e funções)
  seed/images/       fotos dos imóveis de exemplo
scripts/
  create-admin.mjs   npm run admin:criar
  seed.mjs           npm run seed
  baixar-fotos.mjs   copia as fotos dos imóveis anunciados para o site (roda no build)
  restaurar-backup.mjs  npm run backup:restaurar
IDENTIDADE.md        identidade visual e dados da empresa
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run preview` | Gera as páginas e roda tudo no computador (http://localhost:8787) |
| `npm run dev` | Roda o site no modo de desenvolvimento (http://localhost:3000) |
| `npm run build` | Gera as páginas prontas e copia as fotos (pasta `out/`) |
| `npm run deploy` | Gera e publica direto do computador (precisa do `npx wrangler login`) |
| `npm run lint` | Verifica o código |
| `npm run typecheck` | Verifica os tipos do TypeScript (site e serviço) |
| `npm run admin:criar -- email "senha" "Nome"` | Cria o dono (ou troca a senha dele) |
| `npm run seed` | Cadastra os imóveis de exemplo, com fotos |
| `npm run backup:restaurar -- arquivo.json` | Restaura um backup semanal |
