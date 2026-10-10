import type { Metadata } from "next";
import { Differentials } from "@/components/site/differentials";
import { LogoMark } from "@/components/site/logo";
import { SectionHeading } from "@/components/site/section-heading";
import { CtaBand } from "@/components/site/cta-band";
import { getSettings } from "@/lib/public/queries";

export const metadata: Metadata = {
  title: "Sobre a Marinho Imóveis",
  description:
    "Imobiliária de família na Ilha do Governador desde 1982. Venda, aluguel, administração de imóveis e departamento jurídico próprio.",
  alternates: { canonical: "/sobre" },
};

const TIMELINE = [
  { year: "1976", text: "José Marinho de Figueiredo, que chegou ao Rio aos 15 anos vindo de Pedro Velho (RN), faz o curso de corretagem." },
  { year: "1979", text: "Começa a atuar como corretor autônomo na Ilha do Governador." },
  { year: "1982", text: "Inaugura a sede da Marinho Imóveis, ao lado da esposa e sócia, a advogada Sulamita Gonçalves de Figueiredo." },
  { year: "Hoje", text: "A empresa é tocada pelos três filhos, nos departamentos administrativo e jurídico, com Seu Marinho acompanhando tudo de perto." },
];

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <>
      <section className="relative overflow-hidden bg-marinho-950">
        <div className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-marinho-700/50 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:py-28">
          <div>
            <p className="text-[0.7rem] font-semibold tracking-[0.3em] text-dourado-200 uppercase">Sobre nós</p>
            <h1 className="mt-5 font-serif text-4xl leading-tight text-white sm:text-5xl">
              A seriedade é a base de nossas atividades.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-marinho-100/85">
              Desde 1982, ajudamos famílias da Ilha do Governador e de todo o Rio de Janeiro a comprar, vender e alugar
              imóveis com segurança.
            </p>
          </div>
          <div className="hidden justify-center lg:flex">
            <LogoMark className="size-56 drop-shadow-2xl" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Quem somos" title="Uma imobiliária de família" />
          <p className="mt-6 text-lg leading-relaxed whitespace-pre-line text-grafite-700">{settings.about_text}</p>
          <p className="mt-4 leading-relaxed text-grafite-700">
            Acreditamos que a melhor propaganda é a indicação de quem já fez negócio com a gente. Por isso, cada
            atendimento é feito com atenção, transparência e um contrato bem cuidado pelo nosso departamento jurídico.
          </p>
        </div>
        <div>
          <SectionHeading eyebrow="Nossa história" title="De corretor autônomo a referência na Ilha" />
          <ol className="mt-8 space-y-0 border-l-2 border-areia-300">
            {TIMELINE.map((item) => (
              <li key={item.year} className="relative pb-8 pl-8 last:pb-0">
                <span className="absolute top-1.5 -left-[7px] size-3 rounded-full bg-vermelho-600 ring-4 ring-white" aria-hidden />
                <p className="font-serif text-2xl text-marinho-700 lining-nums">{item.year}</p>
                <p className="mt-1 leading-relaxed text-grafite-700">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-areia-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="O que fazemos" title="Do anúncio à entrega das chaves" />
          <div className="mt-10">
            <Differentials />
          </div>
        </div>
      </section>

      <div className="py-20">
        <CtaBand title="Vamos conversar?" text="Quer comprar, vender, alugar ou colocar seu imóvel para administrar? Fale com a nossa equipe." button="Falar com a equipe" />
      </div>
    </>
  );
}
