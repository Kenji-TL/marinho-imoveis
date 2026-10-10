import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PropertyFilters } from "@/components/admin/property-filters";
import { PropertyListRow } from "@/components/admin/property-list-item";
import { buttonPrimary, Notice } from "@/components/admin/ui";
import { listProperties, type PropertyListFilters } from "@/lib/admin/queries";
import { DEAL_TYPES, PROPERTY_STATUSES } from "@/lib/property-options";

export const metadata: Metadata = { title: "Imóveis" };

type SearchParams = PageProps<"/admin/imoveis">["searchParams"];

const NOTICES: Record<string, string> = {
  excluido: "Imóvel excluído.",
};

export default function PropertiesPage({ searchParams }: PageProps<"/admin/imoveis">) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-marinho-950">Imóveis</h1>
        <Link href="/admin/imoveis/novo" className={buttonPrimary}>
          <Plus className="size-4" aria-hidden /> Novo imóvel
        </Link>
      </div>
      <Suspense fallback={<ListSkeleton />}>
        <PropertiesList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

async function PropertiesList({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters: PropertyListFilters = {
    q: typeof params.q === "string" ? params.q.slice(0, 100) : undefined,
    deal: pick(params.negocio, DEAL_TYPES),
    status: pick(params.situacao, PROPERTY_STATUSES),
    visibility: pick(params.site, ["visible", "hidden"] as const),
    page: Number(params.pagina) || 1,
  };
  const { items, total, page, pageCount } = await listProperties(filters);
  const notice = typeof params.aviso === "string" ? NOTICES[params.aviso] : undefined;
  const hasFilters = Boolean(filters.q || filters.deal || filters.status || filters.visibility);

  const pageHref = (n: number) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && key !== "pagina" && key !== "aviso") qs.set(key, value);
    }
    if (n > 1) qs.set("pagina", String(n));
    const s = qs.toString();
    return `/admin/imoveis${s ? `?${s}` : ""}`;
  };

  return (
    <>
      {notice && <Notice tone="success">{notice}</Notice>}
      <PropertyFilters q={filters.q} deal={filters.deal} status={filters.status} visibility={filters.visibility} />

      <p className="text-sm text-grafite-600" aria-live="polite">
        {total === 1 ? "1 imóvel" : `${total} imóveis`}
        {hasFilters && (total === 1 ? " encontrado" : " encontrados")}
      </p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-areia-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-grafite-900">
            {hasFilters ? "Nenhum imóvel com esses filtros." : "Nenhum imóvel cadastrado ainda."}
          </p>
          {!hasFilters && (
            <Link href="/admin/imoveis/novo" className={`${buttonPrimary} mt-4`}>
              <Plus className="size-4" aria-hidden /> Cadastrar o primeiro imóvel
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-areia-200 rounded-xl border border-areia-300 bg-white">
          {items.map((item) => (
            <PropertyListRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="rounded-lg border border-areia-300 bg-white px-4 py-2 text-sm font-medium hover:border-marinho-700">
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-grafite-600">
            Página {page} de {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={pageHref(page + 1)} className="rounded-lg border border-areia-300 bg-white px-4 py-2 text-sm font-medium hover:border-marinho-700">
              Próxima →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="h-16 animate-pulse rounded-xl bg-white" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-white" />
      ))}
    </div>
  );
}
