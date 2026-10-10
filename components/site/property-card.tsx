import { Bath, BedDouble, Car, ImageOff, MapPin, Ruler } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatArea, formatBRL } from "@/lib/format";
import type { PropertyCardData } from "@/lib/public/queries";
import { propertyPath } from "@/lib/site";

/** Até 3 características curtas para a linha de baixo do card */
function cardFacts(p: PropertyCardData) {
  const area = p.usable_area ?? p.total_area;
  return [
    p.bedrooms > 0 && { icon: BedDouble, label: `${p.bedrooms} ${p.bedrooms === 1 ? "quarto" : "quartos"}` },
    p.bathrooms > 0 && { icon: Bath, label: `${p.bathrooms} banh.` },
    area ? { icon: Ruler, label: formatArea(area) } : p.parking_spots > 0 && { icon: Car, label: `${p.parking_spots} ${p.parking_spots === 1 ? "vaga" : "vagas"}` },
  ]
    .filter(Boolean)
    .slice(0, 3) as { icon: typeof Bath; label: string }[];
}

export function PropertyCard({ p, eager = false }: { p: PropertyCardData; eager?: boolean }) {
  const rent = p.deal_type === "rent";
  const price = rent ? p.rent_price : p.sale_price;
  const total = rent && p.rent_price != null ? p.rent_price + (p.condo_fee ?? 0) + (p.iptu_exempt ? 0 : (p.iptu ?? 0)) : null;
  const facts = cardFacts(p);

  return (
    <article className="group relative flex flex-col rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-areia-300/70 transition duration-300 hover:shadow-xl hover:shadow-marinho-950/10 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-marinho-700 has-[a:focus-visible]:ring-offset-2 motion-safe:hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-areia-200">
        {p.cover ? (
          <Image
            src={p.cover.url}
            alt={p.title}
            fill
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            loading={eager ? "eager" : "lazy"}
            className="object-cover transition duration-700 motion-safe:group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-grafite-600">
            <ImageOff className="size-8" aria-hidden />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold tracking-[0.1em] text-white uppercase shadow ${
              rent ? "bg-marinho-700" : "bg-vermelho-600"
            }`}
          >
            {rent ? "Aluguel" : "Venda"}
          </span>
          {p.status === "reserved" && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 shadow">Reservado</span>
          )}
        </div>
        {p.accepts_proposal && (
          <span className="absolute top-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-marinho-950 shadow">
            Aceita proposta
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-2 pt-4 pb-1.5">
        <h3 className="line-clamp-2 text-[0.95rem] leading-snug font-semibold text-grafite-900">
          <Link href={propertyPath(p.slug)} className="after:absolute after:inset-0 focus-visible:outline-none">
            {p.title}
          </Link>
        </h3>
        <p className="mt-1.5 flex items-center gap-1 text-sm text-grafite-600">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {p.neighborhood}, {p.city}
          </span>
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          {price != null && (
            <p className="text-lg font-bold text-marinho-950">
              {formatBRL(price)}
              {rent && <span className="text-sm font-medium text-grafite-600">/mês</span>}
            </p>
          )}
          {total != null && total !== price && <p className="truncate text-xs text-grafite-600">total {formatBRL(total)}</p>}
        </div>
        {facts.length > 0 && (
          <ul className="mt-auto flex items-center gap-3 border-t border-areia-200 pt-3 text-xs text-grafite-600 [&>li+li]:border-l [&>li+li]:border-areia-300 [&>li+li]:pl-3">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5 whitespace-nowrap">
                <Icon className="size-3.5 text-grafite-700" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
