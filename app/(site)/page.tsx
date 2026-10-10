import { ArrowRight, FileCheck2, KeyRound, MapPinned, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { btnDark, btnGold, btnOutlineLight } from "@/components/site/buttons";
import { CtaBand } from "@/components/site/cta-band";
import { LIST_PROPERTY_MESSAGE } from "@/components/site/header";
import { PropertyCard } from "@/components/site/property-card";
import { SearchBox } from "@/components/site/search-box";
import { SectionHeading } from "@/components/site/section-heading";
import { TrustStrip } from "@/components/site/trust-strip";
import { WhatsappIcon } from "@/components/site/whatsapp-icon";
import { getFeaturedProperties, getNeighborhoods, getSettings } from "@/lib/public/queries";
import { GENERIC_WHATSAPP_MESSAGE, whatsappLink } from "@/lib/whatsapp";

const WHY = [
  { icon: MapPinned, title: "Conhecimento local", text: "Somos da Ilha do Governador e conhecemos os bairros do Rio de perto." },
  { icon: UserRound, title: "Atendimento personalizado", text: "Você fala direto com quem cuida do seu negócio, do início ao fim." },
  { icon: FileCheck2, title: "Assessoria completa", text: "Avaliação, anúncio, contrato e documentação em um só lugar." },
  { icon: KeyRound, title: "Administração de aluguéis", text: "Cuidamos do seu imóvel alugado: cobrança, contratos e seguro." },
];

export default async function HomePage() {
  const [settings, featured, neighborhoods] = await Promise.all([
    getSettings(),
    getFeaturedProperties(8),
    getNeighborhoods(),
  ]);
  const whatsapp = whatsappLink(settings.whatsapp, GENERIC_WHATSAPP_MESSAGE);

  const stats = [
    { value: "1982", label: "Ano de fundação" },
    { value: "40+", label: "Anos de mercado" },
    { value: settings.creci ?? "—", label: "CRECI" },
    { value: "Família", label: "Empresa familiar" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-marinho-950">
        <Image
          src="/images/hero-casa.jpg"
          alt="Casa moderna iluminada ao entardecer"
          fill
          preload
          sizes="100vw"
          className="-z-10 object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-marinho-950/95 via-marinho-950/70 to-marinho-950/10" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-marinho-950/70 to-transparent" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-40 sm:px-6 sm:pt-24 lg:pb-48">
          <div className="max-w-2xl motion-safe:animate-[rise_.6s_cubic-bezier(.16,1,.3,1)_both]">
            <p className="text-[0.7rem] font-semibold tracking-[0.3em] text-dourado-200 uppercase">Encontre o lugar certo para você</p>
            <h1 className="mt-5 font-serif text-[2.6rem] leading-[1.08] text-white sm:text-6xl lg:text-7xl">
              Novos lares,
              <br />
              novos começos.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">
              Imóveis para comprar e alugar no Rio de Janeiro, com a orientação de quem está no mercado desde 1982 e um
              departamento jurídico próprio.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/comprar" className={btnGold}>
                Ver imóveis <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={btnOutlineLight}>
                <WhatsappIcon className="size-4" /> Falar no WhatsApp
              </a>
            </div>
          </div>
          <p
            className="absolute top-24 right-10 hidden rotate-[-8deg] font-script font-semibold text-[2.6rem] leading-[1.05] text-white/90 drop-shadow lg:block xl:right-16"
            aria-hidden
          >
            Mais que imóveis,
            <br />
            um futuro
            <br />
            mais leve.
          </p>
        </div>
      </section>

      {/* Busca */}
      <div className="relative z-10 mx-auto -mt-32 max-w-6xl px-4 sm:px-6 lg:-mt-36">
        <SearchBox neighborhoods={neighborhoods} listPropertyHref={whatsappLink(settings.whatsapp, LIST_PROPERTY_MESSAGE)} />
      </div>

      {/* Selos de confiança */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-4 sm:px-6">
        <TrustStrip />
      </section>

      {/* Destaques */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionHeading
            eyebrow="Imóveis em destaque"
            title="Imóveis para uma vida melhor"
            action={
              <Link href="/comprar" className="group inline-flex items-center gap-2 text-sm font-semibold text-marinho-950 underline-offset-4 hover:underline">
                Ver todos os imóveis <ArrowRight className="size-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
              </Link>
            }
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p, i) => (
              <PropertyCard key={p.id} p={p} eager={i < 4} />
            ))}
          </div>
        </section>
      )}

      {/* Por que a Marinho */}
      <section className="bg-areia-100 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.35fr] lg:items-center">
          <div>
            <SectionHeading eyebrow="Por que a Marinho" title="Uma imobiliária parceira em quem você pode confiar" />
            <p className="mt-5 max-w-md leading-relaxed text-grafite-600">
              Unimos o conhecimento de quem vive o mercado do Rio há mais de 40 anos a um atendimento próximo, para que
              você decida com segurança.
            </p>
            <Link href="/sobre" className={`${btnDark} mt-8`}>
              Nossa história <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {WHY.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 rounded-2xl bg-white p-6 ring-1 ring-areia-300/70">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-areia-100 text-marinho-950">
                  <Icon className="size-5" strokeWidth={1.6} aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold text-marinho-950">{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-grafite-600">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mais que uma casa */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:items-stretch">
        <div className="relative min-h-80 overflow-hidden rounded-3xl lg:min-h-[30rem]">
          <Image src="/images/sala-aconchegante.jpg" alt="Sala de estar aconchegante" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-marinho-950/50 to-transparent" aria-hidden />
          <p className="absolute top-8 left-8 -rotate-6 font-script font-semibold text-4xl leading-[1.05] text-white drop-shadow-md" aria-hidden>
            Lares,
            <br />
            famílias,
            <br />
            histórias.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-10">
          <div>
            <SectionHeading eyebrow="Mais que uma casa" title="O próximo capítulo da sua história" />
            <p className="mt-5 max-w-xl leading-relaxed text-grafite-600">
              Seja o primeiro apartamento, a casa maior para a família ou um investimento, a gente ajuda você a encontrar
              um lugar onde a vida acontece, com transparência em cada etapa.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-6 border-y border-areia-300 py-8 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="order-2 mt-1 text-xs text-grafite-600">{s.label}</dt>
                <dd className="font-serif text-3xl text-marinho-950 lining-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/comprar"
            className="group flex items-center gap-5 self-start rounded-2xl bg-white p-3 pr-6 shadow-sm ring-1 ring-areia-300/70 transition hover:shadow-lg"
          >
            <span className="relative block h-20 w-28 shrink-0 overflow-hidden rounded-xl">
              <Image src="/images/casa-piscina.jpg" alt="" fill sizes="112px" className="object-cover" />
            </span>
            <span className="font-script font-semibold text-2xl leading-tight text-marinho-950">
              Um futuro melhor
              <br />
              começa aqui.
            </span>
            <span className="flex size-10 items-center justify-center rounded-full bg-marinho-950 text-white transition group-hover:bg-dourado-400 group-hover:text-marinho-950">
              <ArrowRight className="size-4" aria-hidden />
              <span className="sr-only">Ver imóveis</span>
            </span>
          </Link>
        </div>
      </section>

      <div className="py-20">
        <CtaBand />
      </div>
    </>
  );
}
