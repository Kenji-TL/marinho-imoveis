"use client";

import { SearchX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { DealType } from "@/lib/property-options";
import { applyListingFilters, listingHref, parseListingParams, type ListingFilters } from "@/lib/public/listing-params";
import type { PropertyCardData } from "@/lib/public/queries";
import { btnDark } from "./buttons";
import { ListingFiltersForm } from "./listing-filters";
import { PropertyCard } from "./property-card";

type Props = { deal: DealType; cards: PropertyCardData[]; neighborhoods: string[] };

/** Resultados conforme os filtros da URL (a página pronta traz todos os imóveis) */
export function ListingResultsFromUrl(props: Props) {
  const params = useSearchParams();
  return <ListingResults {...props} filters={parseListingParams(props.deal, Object.fromEntries(params))} />;
}

/** Sem filtros: é o que vai na página pronta, antes de o navegador ler a URL */
export function ListingResultsDefault(props: Props) {
  return <ListingResults {...props} filters={parseListingParams(props.deal, {})} />;
}

function ListingResults({ deal, cards, neighborhoods, filters }: Props & { filters: ListingFilters }) {
  const { items, total, page, pageCount } = applyListingFilters(cards, filters);

  return (
    <div className="space-y-8">
      <ListingFiltersForm key={JSON.stringify(filters)} filters={filters} neighborhoods={neighborhoods} />

      <p className="text-sm text-grafite-600" aria-live="polite">
        {total === 0 ? "Nenhum imóvel encontrado" : total === 1 ? "1 imóvel encontrado" : `${total} imóveis encontrados`}
      </p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-areia-300 px-6 py-16 text-center">
          <SearchX className="size-10 text-grafite-600" aria-hidden />
          <p className="mt-4 font-serif text-2xl text-marinho-950">Nenhum imóvel com esses filtros</p>
          <p className="mt-2 max-w-md text-grafite-600">
            Tente outra combinação ou fale com a gente: muitos imóveis chegam antes de irem para o site.
          </p>
          <Link href={listingHref({ deal })} className={`${btnDark} mt-6`}>
            Ver todos os imóveis
          </Link>
        </div>
      ) : (
        <section aria-labelledby="resultados">
          <h2 id="resultados" className="sr-only">
            Imóveis encontrados
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p, i) => (
              <PropertyCard key={p.id} p={p} eager={i < 3} />
            ))}
          </div>
        </section>
      )}

      {pageCount > 1 && <Pagination page={page} pageCount={pageCount} hrefFor={(n) => listingHref({ ...filters, pagina: n })} />}
    </div>
  );
}

function Pagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (n: number) => string }) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pageCount || Math.abs(n - page) <= 1,
  );
  const item = "flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition";
  return (
    <nav aria-label="Páginas" className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className={`${item} border border-areia-300 hover:border-marinho-700`}>
          ← Anterior
        </Link>
      )}
      {pages.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - pages[i - 1] > 1 && <span className="text-grafite-600">…</span>}
          <Link
            href={hrefFor(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${item} ${n === page ? "bg-marinho-950 text-white" : "border border-areia-300 hover:border-marinho-950"}`}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < pageCount && (
        <Link href={hrefFor(page + 1)} className={`${item} border border-areia-300 hover:border-marinho-700`}>
          Próxima →
        </Link>
      )}
    </nav>
  );
}
