# Checklist de entrega para o cliente

Como passar o site e o sistema para o nome do cliente, de forma que tudo fique **dele**: as contas, os dados, o domínio e o acesso ao painel.

---

## O que precisa ficar no nome do cliente

| O quê | Onde | Como passa para ele |
|---|---|---|
| Domínio `marinhoimoveis.com.br` | Registro.br | Já é dele. Os servidores DNS apontam para a Cloudflare dele. |
| Código do site | GitHub | Repositório na conta dele (você transfere o seu). |
| Banco, fotos e logins | Supabase | Transferência de projeto para a organização dele (os dados e as fotos vão juntos). |
| Site e serviço do painel | Cloudflare | Conta dele. A publicação passa a usar o token dele (veja a Fase 2). Não há dados para copiar. |
| Painel | O próprio site | Login de **dono** no e-mail dele. Ele adiciona o resto da equipe sozinho. |

## Custos mensais

| Serviço | Plano | Custo |
|---|---|---|
| Cloudflare (site, fotos e serviço do painel) | Free | R$ 0, sem cartão |
| Supabase (banco, login e fotos) | Free | R$ 0, sem cartão. A manutenção diária impede a pausa por inatividade |
| GitHub (código e publicação) | Free | R$ 0 |
| E-mail (Resend/Brevo) | Free | R$ 0 |
| Domínio | Registro.br | Cerca de R$ 40 por ano (ele já paga) |

Os limites estão no README ("Limites do plano grátis"). Para um site de imobiliária de bairro, ficam muito longe. Você pode cobrar uma mensalidade de manutenção, mas não precisa repassar custo de servidor.

---

## Fase 1 — Antes do pagamento (tudo nas suas contas)

- [ ] Projeto Supabase criado **na região São Paulo** (a transferência não muda a região).
- [ ] As 6 migrations rodadas (README, passo 2).
- [ ] Cadastro público desligado no Supabase (README, passo 3).
- [ ] Você é o dono do painel por enquanto (`npm run admin:criar`).
- [ ] Cloudflare e GitHub configurados e a primeira publicação feita (README, passos 5 a 7).
- [ ] Imóveis reais cadastrados, ou o seed para demonstração (README, passo 8).
- [ ] Site no ar no endereço provisório (`marinho-imoveis.SUA-CONTA.workers.dev`) para mostrar ao cliente.

## Fase 2 — No pagamento (passar tudo para o cliente)

Faça junto com o cliente, numa chamada ou presencialmente. Leva cerca de 1 hora.

**Contas do cliente**
- [ ] O cliente cria, com o **e-mail da empresa**, contas grátis no GitHub, no Supabase e na Cloudflare.
- [ ] No Supabase, ele cria uma organização (plano Free) e te convida como membro (necessário para a transferência).
- [ ] Na Cloudflare, ele te convida como membro (**Manage Account → Members**), se você for continuar cuidando do site.

**Transferências**
- [ ] **GitHub:** Settings do repositório → *Transfer ownership* → conta do cliente.
- [ ] **Supabase:** Project Settings → General → *Transfer project* → organização do cliente. Desligue antes a integração com o GitHub, se tiver.
- [ ] **Cloudflare:** na conta do cliente, crie o token da API (README, passo 5) e troque, no GitHub, os secrets `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` pelos dele.
- [ ] Gere o `PUBLICAR_TOKEN` com a conta GitHub do cliente (README, passo 6) e troque o secret.
- [ ] Rode a publicação (aba **Actions** → **Publicar o site** → Run workflow). Ela cria o site na Cloudflare do cliente, com os mesmos imóveis e fotos (que vieram com o Supabase).

**Domínio e e-mails**
- [ ] Na Cloudflare do cliente: adicionar o domínio, trocar o DNS no Registro.br e ligar os domínios do site e das fotos (README, passo 9).
- [ ] No GitHub: variável `SITE_URL` com o domínio final → rodar a publicação.
- [ ] No Supabase: Site URL, Redirect URLs, modelos de e-mail e serviço de e-mail próprio (README, "E-mails do painel").
- [ ] Desligar o site provisório na sua conta da Cloudflare (**Workers & Pages → marinho-imoveis → Settings → Delete**).

**Acesso do cliente**
- [ ] Você (ainda dono no painel) vai em **Equipe → Adicionar pessoa**, coloca o e-mail do cliente como **Dono** e escolhe senha provisória ou convite.
- [ ] O cliente entra, troca a senha em **Minha conta** e confere se vê Equipe e Configurações.
- [ ] O cliente adiciona os corretores dele em **Equipe**.
- [ ] Entregue o [manual do cliente](MANUAL-DO-CLIENTE.md).

**Teste final, com o cliente olhando**
- [ ] O site abre no domínio próprio, com cadeado (https).
- [ ] O cliente cadastra um imóvel pelo celular, com foto tirada na hora. O topo do painel mostra "Atualizando o site…" e, em uns 3 minutos, o imóvel aparece no site.
- [ ] O botão de WhatsApp do imóvel abre a conversa com a mensagem certa, no número dele.
- [ ] "Esqueci minha senha" manda o e-mail e o link funciona.

## Fase 3 — Depois da entrega

Combine com o cliente uma das duas opções:

- **Você faz a manutenção:** continue como membro na Cloudflare, no Supabase e no GitHub, e com um acesso no painel (pode ser Corretor). Combine o valor mensal.
- **Entrega total:** o cliente remove você da Cloudflare, do Supabase e do GitHub, e remove o seu acesso em **Equipe**. Tudo continua funcionando, porque é dele.

Em qualquer caso, garanta que **pelo menos duas pessoas da empresa** tenham acesso de dono no painel e nas contas, para ninguém ficar trancado para fora se uma delas sair.

---

## Se algo der errado

| Problema | O que fazer |
|---|---|
| O dono perdeu o acesso ao e-mail e à senha | No seu computador, com a chave secreta do projeto: `npm run admin:criar -- novo@email "senha" "Nome"` |
| Salvou no painel e o site não mudou | Veja o topo do painel. "O site não atualizou": abra a aba **Actions** no GitHub e veja o erro. Aviso de publicação não configurada: falta ou expirou o `PUBLICAR_TOKEN` |
| Convites e e-mails de senha não chegam | Falta o serviço de e-mail próprio, ou o domínio não foi verificado nele. Enquanto isso, use a senha provisória. |
| O link do e-mail diz "inválido ou expirado" | Os links valem por pouco tempo e só uma vez. Peça outro em "Esqueci minha senha". Confira também os Redirect URLs no Supabase. |
| A tela Equipe avisa que falta configurar o serviço | Cadastre o secret `SUPABASE_SECRET_KEY` no GitHub e rode a publicação. |
| O painel não abre | O projeto do Supabase pode ter pausado (por exemplo, se a manutenção diária parou). Reative no painel do Supabase e confira os secrets no GitHub. |
| Perdeu dados do banco | Restaure o backup de domingo (README, "Backup"). |
