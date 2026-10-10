"use client";

import { Search, X } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { DEAL_LABEL, DEAL_TYPES, PROPERTY_STATUSES, STATUS_LABEL } from "@/lib/property-options";
import { inputClass } from "./ui";

export function PropertyFilters({
  q,
  deal,
  status,
  visibility,
}: {
  q?: string;
  deal?: string;
  status?: string;
  visibility?: string;
}) {
  const hasFilters = Boolean(q || deal || status || visibility);
  const select = `${inputClass} py-2 text-sm`;
  const autoSubmit = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();

  return (
    <Form action="/admin/imoveis" className="grid gap-3 rounded-xl border border-areia-300 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
      <div className="relative sm:col-span-2 lg:col-span-1">
        <label htmlFor="q" className="sr-only">
          Buscar
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-grafite-600" aria-hidden />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar por código, título ou bairro"
          className={`${inputClass} py-2 pl-9 text-sm`}
        />
      </div>
      <label className="sr-only" htmlFor="negocio">
        Negócio
      </label>
      <select id="negocio" name="negocio" defaultValue={deal ?? ""} onChange={autoSubmit} className={select}>
        <option value="">Aluguel e venda</option>
        {DEAL_TYPES.map((d) => (
          <option key={d} value={d}>
            {DEAL_LABEL[d]}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="situacao">
        Situação
      </label>
      <select id="situacao" name="situacao" defaultValue={status ?? ""} onChange={autoSubmit} className={select}>
        <option value="">Todas as situações</option>
        {PROPERTY_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="site">
        Visibilidade
      </label>
      <select id="site" name="site" defaultValue={visibility ?? ""} onChange={autoSubmit} className={select}>
        <option value="">No site e ocultos</option>
        <option value="visible">Só os do site</option>
        <option value="hidden">Só os ocultos</option>
      </select>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
        <button type="submit" className="flex-1 rounded-lg bg-marinho-700 px-4 py-2 text-sm font-semibold text-white hover:bg-marinho-600 lg:flex-none">
          Filtrar
        </button>
        {hasFilters && (
          <Link
            href="/admin/imoveis"
            className="inline-flex items-center gap-1 rounded-lg border border-areia-300 px-3 py-2 text-sm text-grafite-700 hover:border-grafite-600"
          >
            <X className="size-4" aria-hidden /> Limpar
          </Link>
        )}
      </div>
    </Form>
  );
}
