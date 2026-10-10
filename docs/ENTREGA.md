# Checklist de entrega para o cliente

Como passar o site e o sistema para o nome do cliente, de forma que tudo fique **dele**: as contas, os dados, o domínio e o acesso ao painel.

---

## O que precisa ficar no nome do cliente

| O quê | Onde | Como passa para ele |
|---|---|---|
| Domínio `marinhoimoveis.com.br` | Registro.br | Já é dele. Você só aponta o DNS para a Vercel. |
| Código do site | GitHub | Repositório na conta dele (você transfere o seu ou ele cria e você envia o código). |
| Banco, fotos e logins | Supabase | Transferência de projeto para a organização dele (os dados vão juntos). |
| Hospedagem | Vercel | Transferência de projeto para a conta/time dele (sem tirar o site do ar). |
| Painel | O próprio site | Login de **dono** no e-mail dele. Ele adiciona o resto da equipe sozinho. |

## Custos mensais (avise antes de fechar)

| Serviço | Plano | Por quê |
|---|---|---|
| Vercel | **Pro** (cerca de US$ 20/mês) | O plano grátis proíbe uso comercial, e site de empresa conta como comercial. |
| Supabase | **Pro** (cerca de US$ 25/mês) | No grátis, o projeto pausa depois de 1 semana sem atividade e o site cai. |
| E-mail (Resend/Brevo) | Grátis | Os planos gratuitos dão conta dos convites e dos e-mails de senha. |
| Domínio | Renovação anual no Registro.br | Ele já paga. |

Os preços mudam: confirme em vercel.com/pricing e supabase.com/pricing antes de passar o orçamento. Você pode embutir esse custo numa mensalidade de hospedagem e manutenção.

---

## Fase 1 — Antes do pagamento (tudo nas suas contas)

- [ ] Projeto Supabase criado **na região São Paulo** (a transferência não muda a região).
- [ ] As 5 migrations rodadas (README, passo 2).
- [ ] Cadastro público desligado no Supabase (README, passo 3).
- [ ] Imóveis reais cadastrados, ou o seed para demonstração.
- [ ] Site publicado na Vercel num endereço provisório (`marinho-imoveis.vercel.app`) para mostrar ao cliente.
- [ ] Você é o dono do painel por enquanto (`npm run admin:criar`).

## Fase 2 — No pagamento (passar tudo para o cliente)

Faça junto com o cliente, numa chamada ou presencialmente. Leva cerca de 1 hora.

**Contas do cliente**
- [ ] O cliente cria, com o **e-mail da empresa**: conta no GitHub, conta na Vercel e conta no Supabase.
- [ ] Na Vercel, ele cria um time e assina o **Pro** com o cartão dele.
- [ ] No Supabase, ele cria uma organização e assina o **Pro** com o cartão dele.
- [ ] Ele te convida como membro na organização do Supabase e no time da Vercel (necessário para a transferência).

**Transferências**
- [ ] **GitHub:** Settings do repositório → *Transfer ownership* → conta do cliente.
- [ ] **Supabase:** Project Settings → General → *Transfer project* → organização do cliente. Desligue antes a integração com o GitHub, se tiver.
- [ ] **Vercel:** Settings do projeto → General → *Transfer Project* → time do cliente. As variáveis de ambiente e os domínios vão junto.
- [ ] Na Vercel do cliente, reconecte o repositório do GitHub (Settings → Git), se ele tiver mudado de dono.

**Domínio e e-mails**
- [ ] Na Vercel: Settings → Domains → adicionar `www.marinhoimoveis.com.br` e `marinhoimoveis.com.br`.
- [ ] No Registro.br: ajustar o DNS conforme as instruções que a Vercel mostrar.
- [ ] Na Vercel: `NEXT_PUBLIC_SITE_URL` com o domínio final → **Redeploy**.
- [ ] No Supabase: Site URL, Redirect URLs, modelos de e-mail e serviço de e-mail próprio (README, "E-mails do painel").

**Acesso do cliente**
- [ ] Você (ainda dono no painel) vai em **Equipe → Adicionar pessoa**, coloca o e-mail do cliente como **Dono** e escolhe senha provisória ou convite.
- [ ] O cliente entra, troca a senha em **Minha conta** e confere se vê Equipe e Configurações.
- [ ] O cliente adiciona os corretores dele em **Equipe**.
- [ ] Entregue o [manual do cliente](MANUAL-DO-CLIENTE.md).

**Teste final, com o cliente olhando**
- [ ] O site abre no domínio próprio, com cadeado (https).
- [ ] O cliente cadastra um imóvel pelo celular, com foto tirada na hora, e ele aparece no site.
- [ ] O botão de WhatsApp do imóvel abre a conversa com a mensagem certa, no número dele.
- [ ] "Esqueci minha senha" manda o e-mail e o link funciona.

## Fase 3 — Depois da entrega

Combine com o cliente uma das duas opções:

- **Você faz a manutenção:** continue como membro na Vercel, no Supabase e no GitHub, e com um acesso no painel (pode ser Corretor). Combine o valor mensal.
- **Entrega total:** o cliente remove você da Vercel, do Supabase e do GitHub, e remove o seu acesso em **Equipe**. Tudo continua funcionando, porque é dele.

Em qualquer caso, garanta que **pelo menos duas pessoas da empresa** tenham acesso de dono no painel e nas contas, para ninguém ficar trancado para fora se uma delas sair.

---

## Se algo der errado

| Problema | O que fazer |
|---|---|
| O dono perdeu o acesso ao e-mail e à senha | No seu computador, com a chave secreta do projeto: `npm run admin:criar -- novo@email "senha" "Nome"` |
| Convites e e-mails de senha não chegam | Falta o serviço de e-mail próprio, ou o domínio não foi verificado nele. Enquanto isso, use a senha provisória. |
| O link do e-mail diz "inválido ou expirado" | Os links valem por pouco tempo e só uma vez. Peça outro em "Esqueci minha senha". Confira também os Redirect URLs no Supabase. |
| A tela Equipe avisa que falta a chave secreta | Cadastre `SUPABASE_SECRET_KEY` na Vercel (sem `NEXT_PUBLIC_`) e faça Redeploy. |
| O site saiu do ar dias depois da entrega | O projeto Supabase está no plano grátis e pausou. Reative no painel do Supabase e assine o Pro. |
