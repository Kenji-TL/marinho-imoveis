# Identidade visual — Marinho Imóveis

Levantamento feito a partir do site atual (www.marinhoimoveis.com.br, feito no Mobirise) em 09/10/2026.
Páginas analisadas: Home, A Empresa, Locação, Venda, Contato, Documentação, Simuladores e Cartórios, Bairros.

---

## 1. Logo

- **Arquivo salvo:** `public/logo-marinho-original.jpg` (523×147 px, JPG com fundo branco)
- **Composição:** casinha com telhado de tijolos vermelhos, monograma **"MI"** em azul sobre a casa, nome **"Marinho Imóveis ltda."** em serifa (o "I" de Imóveis é uma barra vertical vermelha), "CRECI 2267" no canto e uma faixa azul inferior com o slogan em caixa alta.
- **Problema:** é um arquivo pequeno, com fundo branco e o CRECI e o slogan embutidos. Ele não funciona sobre fundo escuro nem sobre foto, e fica borrado em telas retina.
- **Proposta para o site novo:**
  - Ideal: pedir ao cliente o arquivo vetorial (AI, PDF, EPS ou SVG).
  - Alternativa: redesenhar o logo em SVG, fiel ao original, em duas versões: completa (casa + nome) para o cabeçalho e só o monograma "MI" na casa para favicon e ícone. O CRECI e o slogan passam a ser texto no site, fora da imagem.

---

## 2. Paleta de cores

### Cores atuais (extraídas do CSS do site e dos pixels do logo)

| Papel | HEX | Onde aparece |
|---|---|---|
| **Azul Marinho** (primária) | `#020098` | Faixas, botões e títulos do site (55 ocorrências no CSS). Bate com o azul do logo (`#000096`). |
| **Vermelho Marinho** (secundária) | `#E81C2B` | Tijolos e barras do logo (amostrado do arquivo). O site usa variações mais "berrantes": `#F70808` e `#FF0000`. |
| Texto principal | `#232323` | Corpo do texto |
| Texto secundário | `#767676` / `#6B6763` | Legendas e descrições |
| Fundo claro | `#FFFFFF`, `#EFEFEF`, `#F9F9F9` | Seções alternadas |
| Fundo bege | `#E9E5DC` | Blocos de destaque |
| Rodapé escuro | `#1B1B1B` | Rodapé |

O `#149DCC` (azul-claro) também aparece no CSS, mas é a cor padrão do Mobirise e não faz parte da marca. Fica de fora.

### Paleta proposta para o site novo

As duas cores da marca continuam. O ar premium vem de fundos neutros e quentes, muito respiro e do vermelho usado com moderação.

| Token | HEX | Uso |
|---|---|---|
| `marinho-950` | `#05073D` | Fundo do rodapé, overlay do hero e seções escuras |
| `marinho-700` (primária) | `#020098` | Botões principais, links e selo **ALUGUEL** |
| `marinho-50` | `#EEF0FB` | Fundos suaves de destaque e chips de filtro |
| `vermelho-600` (acento) | `#E81C2B` | Selo **VENDA**, linha fina de assinatura (eco das barras do logo), detalhes |
| `areia-100` | `#F7F5F0` | Fundo de seções alternadas (versão mais clara do bege atual) |
| `areia-300` | `#E9E5DC` | Bordas e divisórias |
| `grafite-900` | `#1B1B1B` | Títulos e texto principal |
| `grafite-600` | `#6B6763` | Texto secundário (contraste 5,6:1 no branco) |
| `whatsapp` | `#15803D` | Botões de WhatsApp com texto branco (contraste 5:1). O verde oficial `#25D366` com texto branco não passa no teste de acessibilidade. |

**Selos de negócio:** ALUGUEL em azul `#020098` e VENDA em vermelho `#E81C2B`, os dois com texto branco (ambos passam em contraste AA).

---

## 3. Tipografia

**Atual:** **Rubik** (Google Fonts) e **Montserrat** no site. O logo usa uma serifa clássica, estilo Times, no nome e no CRECI, e uma sans em caixa alta espaçada no slogan.

**Proposta (Google Fonts):**

| Uso | Fonte | Por quê |
|---|---|---|
| Títulos, preços em destaque, nome dos imóveis | **Playfair Display** (600–700) | Serifa elegante que ecoa a serifa do logo e dá o tom "imobiliária de alto padrão" |
| Corpo, interface, filtros, botões | **Montserrat** (400–600) | Já é usada no site atual, o que mantém a continuidade. A caixa alta espaçada lembra a faixa do slogan no logo. |

---

## 4. Dados da empresa

| Campo | Valor |
|---|---|
| **Nome** | Marinho Imóveis Ltda. |
| **Slogan** | "A seriedade é a base de nossas atividades" (está no logo) |
| **Chamada do site** | "Quer comprar? Quer alugar? Está no lugar certo!" |
| **CRECI** | 2267 (no logo e na home) ⚠️ ver pendências |
| **Fundação** | Sede inaugurada em 1982 por José Marinho de Figueiredo e Sulamita Gonçalves de Figueiredo (advogada e sócia). Hoje é tocada pelos três filhos. |
| **Endereço** | Rua República Árabe da Síria, 129 — Salas 315 e 316, Portuguesa, Ilha do Governador, Rio de Janeiro/RJ, CEP 21931-370 |
| **Telefone fixo** | (21) 2463-1122 (também aparecem 2463-3393 e 2463-2066) |
| **WhatsApp principal** | (21) 99780-1515 (cabeçalho e botão atual) ⚠️ ver pendências |
| **E-mail** | locacao@marinhoimoveis.com.br |
| **Instagram** | [@marinhoimoveisrj](https://www.instagram.com/marinhoimoveisrj/) |
| **Facebook** | https://m.facebook.com/www.marinhoimoveis.com.br (o link atual é de versão mobile e parece mal configurado; confirmar a página certa) |
| **Área de atuação** | Base na Ilha do Governador, atendendo todos os bairros do Rio. Tem imóveis também em Saquarema e Nova Iguaçu. |
| **Serviços** | Locação, compra e venda, administração de imóveis e condomínios, legalização de imóveis, departamento jurídico (direito imobiliário) |

---

## 5. Tom de voz

**Hoje:** formal, tradicional e familiar. O texto valoriza **seriedade, honestidade, indicação "boca a boca"** e a trajetória do fundador, que saiu de Pedro Velho (RN), foi vendedor ambulante e montou a imobiliária. Os textos são longos, com algum juridiquês ("ilidir eventuais problemas") e erros de digitação.

**Para o site novo:**
- Manter o que é forte: **tradição desde 1982, empresa de família, seriedade e atendimento próximo**. Isso diferencia a Marinho dos portais grandes.
- Textos curtos e diretos, tratando o cliente por "você", sem juridiquês e sem exagero de vendedor.
- A história do Seu Marinho vira uma seção resumida e emocional na página Sobre.
- Exemplo de tom: *"Desde 1982 ajudando famílias da Ilha do Governador e de todo o Rio a encontrar o imóvel certo — com a seriedade que virou nosso sobrenome."*

---

## 6. Estrutura do site atual

| Página atual | Conteúdo | Vai para |
|---|---|---|
| Home (`index.html`) | Carrossel "Quer comprar? Quer alugar?", texto institucional, cards Locação / Compra e Venda / Legalização, chamadas para locação e venda, links úteis (índice de reajuste, advogados, simulador, bairros), rodapé | **Home** |
| A Empresa (`whois.html`) | Quem somos (história do fundador), Nossa Equipe, Nosso Objetivo, Departamento Jurídico | **/sobre** |
| Locação (`gallery-rent.html`) | ~15 imóveis agrupados por 1, 2 e 3 quartos e lojas/salas. Cada um tem foto, endereço, descrição, aluguel, condomínio, IPTU e um link "Veja as fotos" para um álbum separado | **/alugar** + **/imovel/[slug]** |
| Venda (`gallery-sale.html`) | ~15 imóveis agrupados por 1, 2, 3 e 4+ quartos, com valor de venda | **/comprar** + **/imovel/[slug]** |
| Contato (`contact.html`) | Formulário (nome, e-mail, telefone, mensagem) | **/contato** |
| Documentação (`docs.html`) | Serviços de administração, documentos exigidos, garantias (seguro fiança Porto Seguro, fiador, depósito), fichas proposta | Fora do escopo (ver sugestões) |
| Simuladores e Cartórios (`services.html`) | Links de simulador de financiamento (Caixa, Itaú, Bradesco, Santander) e lista de cartórios | Fora do escopo |
| Bairros (`bairros.html`) | Texto sobre bairros do Rio (copiado da Wikipédia) | Descartar |

**Menu atual:** A Empresa · Locação · Venda · E-mail · telefone

**Padrões nos anúncios atuais que o sistema novo precisa cobrir:**
- **"Estuda-se proposta"** aparece em vários imóveis. Sugestão: um checkbox "Aceita proposta" no cadastro, exibido como selo.
- Taxas fora do padrão: "IPTU isento", "Rateio de despesas R$ 250", "Consumo de água e luz individualizado", "+ taxa de água". Sugestão: deixar condomínio e IPTU opcionais, aceitar "Isento" e incluir um campo livre de "Observações sobre valores".
- Imóveis comerciais (lojas e salas) são comuns na locação. Os tipos de imóvel precisam incluir **Loja** e **Sala comercial**.
- Faixa de valores ("Salas de R$ 800 a R$ 1.000"): no sistema novo, cada sala vira um imóvel próprio.

---

## 7. Direção de design do site novo

- **Sensação:** imobiliária tradicional que virou premium. Confiável, limpa e com fotos grandes.
- **Base clara:** branco e `#F7F5F0`, com seções escuras pontuais em `#05073D` (hero com overlay e rodapé).
- **Assinatura visual:** linha fina vermelha (2–3 px) sob títulos de seção e no topo do rodapé, ecoando as barras vermelhas do logo.
- **Cards:** cantos de 12 px, sombra bem sutil, foto 4:3 com selo ALUGUEL/VENDA no canto, preço em Playfair.
- **Botões:** cantos de 8 px. Primário azul `#020098`, WhatsApp verde `#15803D`, secundário com contorno.
- **Ícones:** traço fino (Lucide) para quartos, banheiros, vagas e m².
- **Animações:** fade/slide curto ao rolar e zoom leve na foto do card no hover. Nada além disso.

---

## ⚠️ Pendências para confirmar com o cliente

1. **WhatsApp oficial do site:** aparecem três números diferentes: **(21) 99780-1515** (cabeçalho e botão atual), **(21) 96431-9961** (texto da página de locação) e **(21) 99963-7716** (anúncios de venda). Proposta: 99780-1515 como padrão, editável no painel.
2. **CRECI:** o logo diz **2267** e os anúncios de venda dizem "CRECI JURIDICO **226**" (parece um dígito faltando). Confirmar o número correto.
3. **Logo em vetor:** o cliente tem o arquivo original? Se não tiver, redesenho em SVG.
4. **Salas:** a página A Empresa diz "Salas 315 e **326**" e as outras dizem "315 e **316**". Usei 316.
5. **Facebook:** confirmar o link da página.
