"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { PropertyFilters } from "@/components/admin/property-filters";
import { PropertyListRow } from "@/components/admin/property-list-item";
import { buttonPrimary, Notice } from "@/components/admin/ui";
import { listProperties, type PropertyListFilters } from "@/lib/admin/api";
import { useLoad } from "@/lib/admin/use-load";
import { DEAL_TYPES, PROPERTY_STATUSES } from "@/lib/property-options";

const NOTICES: Record<string, string> = {
  excluido: "Imóvel excluído. O site atualiza em uns 3 minutos.",
};

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function PropertiesView() {
  const params = useSearchParams();
  const q = params.get("q")?.slice(0, 100) || undefined;
  const deal = pick(params.get("negocio"), DEAL_TYPES);
  const status = pick(params.get("situacao"), PROPERTY_STATUSES);
  const visibility = pick(params.get("site"), ["visible", "hidden"] as const);
  const page = Number(params.get("pagina")) || 1;
  const aviso = params.get("aviso");

  const load = useCallback(
    () => listProperties({ q, deal, status, visibility, page } satisfies PropertyListFilters),
    [q, deal, status, visibility, page],
  );
  const { data, error, loading, reload } = useLoad(load);
  const notice = aviso ? NOTICES[aviso] : undefined;
  const hasFilters = Boolean(q || deal || status || visibility);

  const pageHref = (n: number) => {
    const qs = new URLSearchParams(params);
    qs.delete("pagina");
    qs.delete("aviso");
    if (n > 1) qs.set("pagina", String(n));
    const s = qs.toString();
    return `/admin/imoveis${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-marinho-950">Imóveis</h1>
        <Link href="/admin/imoveis/novo" className={buttonPrimary}>
          <Plus className="size-4" aria-hidden /> Novo imóvel
        </Link>
      </div>

      {notice && <Notice tone="success">{notice}</Notice>}
      <PropertyFilters key={params.toString()} q={q} deal={deal} status={status} visibility={visibility} />

      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : !data ? (
        <ListSkeleton />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : undefined} aria-busy={loading}>
          <p className="mb-5 text-sm text-grafite-600" aria-live="polite">
            {data.total === 1 ? "1 imóvel" : `${data.total} imóveis`}
            {hasFilters && (data.total === 1 ? " encontrado" : " encontrados")}
          </p>

          {data.items.length === 0 ? (
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
              {data.items.map((item) => (
                <PropertyListRow key={item.id} item={item} onChanged={reload} />
              ))}
            </ul>
          )}

          {data.pageCount > 1 && (
            <nav aria-label="Paginação" className="mt-5 flex items-center justify-between gap-3">
              {data.page > 1 ? (
                <Link href={pageHref(data.page - 1)} className="rounded-lg border border-areia-300 bg-white px-4 py-2 text-sm font-medium hover:border-marinho-700">
                  ← Anterior
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm text-grafite-600">
                Página {data.page} de {data.pageCount}
              </span>
              {data.page < data.pageCount ? (
                <Link href={pageHref(data.page + 1)} className="rounded-lg border border-areia-300 bg-white px-4 py-2 text-sm font-medium hover:border-marinho-700">
                  Próxima →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-white" />
      ))}
    </div>
  );
}
