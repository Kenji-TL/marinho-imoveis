"use client";

import { SlidersHorizontal, X } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useState } from "react";
import { PROPERTY_TYPE_LABEL, PROPERTY_TYPES, type DealType } from "@/lib/property-options";
import { MIN_OPTIONS, PRICE_RANGES, SORT_OPTIONS, type ListingFilters } from "@/lib/public/listing-params";

const select =
  "w-full rounded-lg border border-areia-300 bg-white px-3 py-2.5 text-sm text-grafite-900 outline-none transition focus:border-marinho-700 focus:ring-2 focus:ring-marinho-100";

export function ListingFiltersForm({
  filters,
  neighborhoods,
}: {
  filters: ListingFilters;
  neighborhoods: string[];
}) {
  const [open, setOpen] = useState(false);
  const action = filters.deal === "rent" ? "/alugar" : "/comprar";
  const active = [filters.tipo, filters.bairro, filters.preco, filters.quartos, filters.vagas].filter(Boolean).length;
  const autoSubmit = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();

  const field = (id: string, label: string, control: React.ReactNode) => (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-semibold tracking-wide text-grafite-600 uppercase">
        {label}
      </label>
      {control}
    </div>
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="filtros"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-areia-300 bg-white px-4 py-3 text-sm font-semibold text-marinho-950 lg:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Filtros{active > 0 && ` (${active})`}
      </button>

      <Form
        id="filtros"
        action={action}
        className={`${open ? "grid" : "hidden"} mt-3 gap-3 rounded-2xl border border-areia-300 bg-white p-4 sm:grid-cols-2 lg:mt-0 lg:grid lg:grid-cols-6 lg:items-end`}
      >
        {field(
          "f-tipo",
          "Tipo",
          <select id="f-tipo" name="tipo" defaultValue={filters.tipo ?? ""} onChange={autoSubmit} className={select}>
            <option value="">Todos</option>
            {PROPERTY_TYPES.filter((t) => t !== "outro").map((t) => (
              <option key={t} value={t}>{PROPERTY_TYPE_LABEL[t]}</option>
            ))}
          </select>,
        )}
        {field(
          "f-bairro",
          "Bairro",
          <select id="f-bairro" name="bairro" defaultValue={filters.bairro ?? ""} onChange={autoSubmit} className={select}>
            <option value="">Todos</option>
            {filters.bairro && !neighborhoods.includes(filters.bairro) && <option value={filters.bairro}>{filters.bairro}</option>}
            {neighborhoods.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>,
        )}
        {field(
          "f-preco",
          filters.deal === "rent" ? "Aluguel" : "Valor",
          <select id="f-preco" name="preco" defaultValue={filters.preco ?? ""} onChange={autoSubmit} className={select}>
            <option value="">Qualquer valor</option>
            {PRICE_RANGES[filters.deal as DealType].map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>,
        )}
        {field(
          "f-quartos",
          "Quartos",
          <select id="f-quartos" name="quartos" defaultValue={filters.quartos ?? ""} onChange={autoSubmit} className={select}>
            <option value="">Qualquer</option>
            {MIN_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>,
        )}
        {field(
          "f-vagas",
          "Vagas",
          <select id="f-vagas" name="vagas" defaultValue={filters.vagas ?? ""} onChange={autoSubmit} className={select}>
            <option value="">Qualquer</option>
            {MIN_OPTIONS.slice(0, 3).map((n) => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>,
        )}
        {field(
          "f-ordem",
          "Ordenar",
          <select id="f-ordem" name="ordem" defaultValue={filters.ordem} onChange={autoSubmit} className={select}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>,
        )}
        <div className="flex gap-2 sm:col-span-2 lg:hidden">
          <button type="submit" className="flex-1 rounded-full bg-marinho-950 px-4 py-3 text-sm font-semibold text-white hover:bg-marinho-800">
            Ver imóveis
          </button>
        </div>
        <noscript>
          <button type="submit" className="rounded-full bg-marinho-950 px-4 py-2.5 text-sm font-semibold text-white">Filtrar</button>
        </noscript>
      </Form>

      {active > 0 && (
        <Link href={action} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-marinho-700 hover:underline">
          <X className="size-4" aria-hidden /> Limpar filtros
        </Link>
      )}
    </div>
  );
}
