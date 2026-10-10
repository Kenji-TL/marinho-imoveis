import { SearchX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import type { DealType } from "@/lib/property-options";
import { listingHref, parseListingParams } from "@/lib/public/listing-params";
import { getListing, getNeighborhoods } from "@/lib/public/queries";
import { ListingFiltersForm } from "./listing-filters";
import { btnDark } from "./buttons";
import { PropertyCard } from "./property-card";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const COPY: Record<DealType, { title: string; description: string; eyebrow: string }> = {
  rent: {
    eyebrow: "Alugar",
    title: "Imóveis para alugar",
    description: "Apartamentos, casas, lojas e salas para alugar na Ilha do Governador e em todo o Rio de Janeiro.",
  },
  sale: {
    eyebrow: "Comprar",
    title: "Imóveis à venda",
    description: "Encontre sua casa própria ou seu próximo investimento, com a segurança do nosso departamento jurídico.",
  },
};

export function ListingPage({ deal, searchParams }: { deal: DealType; searchParams: SearchParams }) {
  const copy = COPY[deal];
  return (
    <>
      <section className="border-b border-areia-300 bg-areia-100">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <nav aria-label="Você está em" className="text-sm text-grafite-600">
            <Link href="/" className="hover:text-marinho-950">Início</Link> <span aria-hidden>/</span> {copy.eyebrow}
          </nav>
          <h1 className="mt-3 font-serif text-4xl text-marinho-950 sm:text-5xl">{copy.title}</h1>
          <p className="mt-3 max-w-2xl text-grafite-600">{copy.description}</p>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Suspense fallback={<ListingSkeleton />}>
          <Results deal={deal} searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Results({ deal, searchParams }: { deal: DealType; searchParams: SearchParams }) {
  const filters = parseListingParams(deal, await searchParams);
  const [{ items, total, pageCount }, neighborhoods] = await Promise.all([getListing(filters), getNeighborhoods()]);
  const page = Math.min(filters.pagina, pageCount);

  return (
    <div className="space-y-8">
      <ListingFiltersForm key={JSON.stringify(filters)} filters={filters} neighborhoods={neighborhoods[deal]} />

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

function ListingSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="h-20 animate-pulse rounded-2xl bg-areia-100" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-areia-300">
            <div className="aspect-[4/3] animate-pulse bg-areia-200" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-1/3 animate-pulse rounded bg-areia-200" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-areia-200" />
              <div className="h-6 w-1/2 animate-pulse rounded bg-areia-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
