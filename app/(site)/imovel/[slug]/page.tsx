import { Bath, BedDouble, Car, Check, DoorOpen, Info, MapPin, Maximize, Ruler } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { Gallery } from "@/components/site/gallery";
import { LocationMap } from "@/components/site/location-map";
import { monthlyTotal, PriceCard } from "@/components/site/price-card";
import { PropertyCard } from "@/components/site/property-card";
import { DealTag, SoftTag } from "@/components/site/property-facts";
import { SectionHeading } from "@/components/site/section-heading";
import { WhatsappIcon } from "@/components/site/whatsapp-icon";
import { formatArea, formatBRL } from "@/lib/format";
import { PROPERTY_TYPE_LABEL, STATUS_LABEL } from "@/lib/property-options";
import { getPropertyBySlug, getPublishedSlugs, getSettings, getSimilarProperties } from "@/lib/public/queries";
import { sanitizeDescription } from "@/lib/sanitize";
import { GENERIC_WHATSAPP_MESSAGE, propertyWhatsappMessage, whatsappLink } from "@/lib/whatsapp";

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  // O Next exige ao menos um endereço; imóveis novos são gerados na primeira visita
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "imovel-mi-0000" }];
}

export async function generateMetadata({ params }: PageProps<"/imovel/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPropertyBySlug(slug);
  if (!result) return { title: "Imóvel não encontrado" };
  const p = result.property;
  const price = p.deal_type === "rent" ? p.rent_price : p.sale_price;
  return {
    title: p.title,
    description: `${p.deal_type === "rent" ? "Aluguel" : "Venda"} · ${PROPERTY_TYPE_LABEL[p.property_type]} em ${p.neighborhood}, ${p.city}${
      price != null ? ` · ${formatBRL(price)}${p.deal_type === "rent" ? "/mês" : ""}` : ""
    }. Código ${p.code}.`,
    alternates: { canonical: `/imovel/${result.canonicalSlug}` },
  };
}

export default function PropertyPage({ params }: PageProps<"/imovel/[slug]">) {
  return (
    <Suspense fallback={<PropertySkeleton />}>
      <PropertyContent params={params} />
    </Suspense>
  );
}

async function PropertyContent({ params }: Pick<PageProps<"/imovel/[slug]">, "params">) {
  const { slug } = await params;
  const [result, settings] = await Promise.all([getPropertyBySlug(slug), getSettings()]);
  if (!result) notFound();
  if (result.canonicalSlug !== slug) permanentRedirect(`/imovel/${result.canonicalSlug}`);

  const p = result.property;
  const closed = p.status === "rented" || p.status === "sold";
  const rent = p.deal_type === "rent";
  const whatsappHref = whatsappLink(
    settings.whatsapp,
    closed
      ? `${GENERIC_WHATSAPP_MESSAGE} Vi o imóvel ${p.title} (código ${p.code}), que já foi ${rent ? "alugado" : "vendido"}, e gostaria de opções parecidas.`
      : propertyWhatsappMessage(p),
  );
  const address = [p.street && (p.number && !p.hide_number ? `${p.street}, ${p.number}` : p.street), p.neighborhood, `${p.city}/${p.state}`]
    .filter(Boolean)
    .join(" · ");
  const description = sanitizeDescription(p.description);
  const total = monthlyTotal(p);
  const price = rent ? p.rent_price : p.sale_price;

  const facts = [
    p.bedrooms > 0 && { icon: BedDouble, value: p.bedrooms, label: p.bedrooms === 1 ? "Quarto" : "Quartos" },
    p.suites > 0 && { icon: DoorOpen, value: p.suites, label: p.suites === 1 ? "Suíte" : "Suítes" },
    p.bathrooms > 0 && { icon: Bath, value: p.bathrooms, label: p.bathrooms === 1 ? "Banheiro" : "Banheiros" },
    p.parking_spots > 0 && { icon: Car, value: p.parking_spots, label: p.parking_spots === 1 ? "Vaga" : "Vagas" },
    p.usable_area && { icon: Ruler, value: formatArea(p.usable_area), label: "Área útil" },
    p.total_area && { icon: Maximize, value: formatArea(p.total_area), label: "Área total" },
  ].filter(Boolean) as { icon: typeof Bath; value: string | number; label: string }[];

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:pb-16">
        <nav aria-label="Você está em" className="text-sm text-grafite-600">
          <Link href="/" className="hover:text-marinho-700">Início</Link> <span aria-hidden>/</span>{" "}
          <Link href={rent ? "/alugar" : "/comprar"} className="hover:text-marinho-700">{rent ? "Alugar" : "Comprar"}</Link>{" "}
          <span aria-hidden>/</span> <span className="text-grafite-900">{p.code}</span>
        </nav>

        <header className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <DealTag deal={p.deal_type} />
            <SoftTag tone="dark">{PROPERTY_TYPE_LABEL[p.property_type]}</SoftTag>
            {p.status !== "available" && <SoftTag tone="amber">{STATUS_LABEL[p.status]}</SoftTag>}
          </div>
          <h1 className="max-w-4xl font-serif text-3xl leading-tight text-marinho-950 sm:text-4xl lg:text-5xl">{p.title}</h1>
          <p className="flex items-start gap-2 text-grafite-600">
            <MapPin className="mt-0.5 size-5 shrink-0 text-vermelho-600" aria-hidden />
            {address}
          </p>
        </header>

        {closed && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
            Este imóvel já foi {rent ? "alugado" : "vendido"}. Veja abaixo opções parecidas ou fale com a gente.
          </div>
        )}

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-12">
            <Gallery photos={p.images} title={p.title} />

            {/* Valores no celular, logo abaixo das fotos (no desktop ficam na lateral) */}
            <div className="lg:hidden">
              <PriceCard p={p} whatsappHref={whatsappHref} phone={settings.phone} closed={closed} />
            </div>

            {facts.length > 0 && (
              <section aria-labelledby="caracteristicas">
                <h2 id="caracteristicas" className="font-serif text-2xl text-marinho-950">Características</h2>
                <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {facts.map(({ icon: Icon, value, label }) => (
                    <li key={label} className="flex items-center gap-3 rounded-xl bg-areia-100 p-4">
                      <Icon className="size-6 shrink-0 text-marinho-700" aria-hidden />
                      <span>
                        <span className="block font-semibold text-grafite-900 lining-nums">{value}</span>
                        <span className="block text-sm text-grafite-600">{label}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {p.amenities.length > 0 && (
              <section aria-labelledby="comodidades">
                <h2 id="comodidades" className="font-serif text-2xl text-marinho-950">Comodidades</h2>
                <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {p.amenities.map((a) => (
                    <li key={a} className="flex items-center gap-3 text-grafite-700">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-marinho-50">
                        <Check className="size-3.5 text-marinho-700" aria-hidden />
                      </span>
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {description && (
              <section aria-labelledby="descricao">
                <h2 id="descricao" className="font-serif text-2xl text-marinho-950">Descrição</h2>
                <div
                  className="mt-5 max-w-3xl text-base leading-relaxed text-grafite-700 [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_strong]:font-semibold [&_strong]:text-grafite-900 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:marker:text-vermelho-600"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </section>
            )}

            <section aria-labelledby="localizacao">
              <h2 id="localizacao" className="font-serif text-2xl text-marinho-950">Localização</h2>
              <p className="mt-2 text-sm text-grafite-600">
                {address}
                {p.hide_number && " · localização aproximada"}
              </p>
              <div className="mt-5">
                <LocationMap
                  street={p.street}
                  number={p.number}
                  neighborhood={p.neighborhood}
                  city={p.city}
                  state={p.state}
                  approximate={p.hide_number}
                />
              </div>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <PriceCard p={p} whatsappHref={whatsappHref} phone={settings.phone} closed={closed} />
            </div>
          </aside>
        </div>

      </div>

      <Suspense>
        <Similar property={p} />
      </Suspense>

      {/* Barra fixa do WhatsApp no celular */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-areia-300 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          {price != null && (
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-xl leading-tight text-marinho-950 lining-nums">
                {formatBRL(price)}
                {rent && <span className="font-sans text-sm text-grafite-600">/mês</span>}
              </p>
              {total != null && total !== price && <p className="text-xs text-grafite-600">Total {formatBRL(total)}/mês</p>}
            </div>
          )}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-2 rounded-full bg-whatsapp-600 px-5 py-3.5 font-semibold text-white shadow-lg transition hover:bg-whatsapp-700"
          >
            <WhatsappIcon className="size-5" />
            {closed ? "Ver parecidos" : "Tenho interesse"}
          </a>
        </div>
      </div>
    </>
  );
}

async function Similar({ property }: { property: Parameters<typeof getSimilarProperties>[0] }) {
  const similar = await getSimilarProperties(
    {
      id: property.id,
      deal_type: property.deal_type,
      neighborhood: property.neighborhood,
      property_type: property.property_type,
      rent_price: property.rent_price,
      sale_price: property.sale_price,
    },
    3,
  );
  if (!similar.length) return null;
  return (
    <section className="border-t border-areia-300 bg-areia-100 py-16 pb-32 lg:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Você também pode gostar" title="Imóveis semelhantes" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {similar.map((s) => (
            <PropertyCard key={s.id} p={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PropertySkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6" aria-hidden>
      <div className="h-4 w-48 animate-pulse rounded bg-areia-200" />
      <div className="mt-6 h-10 w-3/4 animate-pulse rounded bg-areia-200" />
      <div className="mt-3 h-5 w-1/2 animate-pulse rounded bg-areia-200" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="aspect-[16/10] animate-pulse rounded-2xl bg-areia-200" />
        <div className="hidden h-96 animate-pulse rounded-2xl bg-areia-200 lg:block" />
      </div>
    </div>
  );
}
