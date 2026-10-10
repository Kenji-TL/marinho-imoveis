"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import { useRef, useState, type KeyboardEvent } from "react";
import { PROPERTY_TYPE_LABEL, PROPERTY_TYPES, type DealType } from "@/lib/property-options";
import { PRICE_RANGES } from "@/lib/public/listing-params";
import { WhatsappIcon } from "./whatsapp-icon";

type Tab = DealType | "list";

const select =
  "w-full appearance-none rounded-lg border border-areia-300 bg-white bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b6763'%3E%3Cpath d='M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z'/%3E%3C/svg%3E\")] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat py-3 pr-9 pl-3.5 text-sm text-grafite-900 outline-none transition focus:border-marinho-700 focus:ring-2 focus:ring-marinho-100";

const TABS: { value: Tab; label: string }[] = [
  { value: "sale", label: "Comprar" },
  { value: "rent", label: "Alugar" },
  { value: "list", label: "Anunciar" },
];

/** Busca da página inicial: Comprar / Alugar (filtros) ou Anunciar (WhatsApp) */
export function SearchBox({
  neighborhoods,
  listPropertyHref,
}: {
  neighborhoods: Record<DealType, string[]>;
  listPropertyHref: string;
}) {
  const [tab, setTab] = useState<Tab>("sale");
  const deal: DealType = tab === "rent" ? "rent" : "sale";
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Setas, Home e End trocam de aba (padrão de abas acessíveis)
  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = TABS.length - 1;
    const next =
      e.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next == null) return;
    e.preventDefault();
    setTab(TABS[next].value);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="O que você procura?" data-surface="dark" className="flex">
        {TABS.map(({ value, label }, index) => (
          <button
            key={value}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            id={`busca-aba-${value}`}
            type="button"
            role="tab"
            aria-selected={tab === value}
            aria-controls="busca-painel"
            tabIndex={tab === value ? 0 : -1}
            onKeyDown={(e) => onTabKey(e, index)}
            onClick={() => setTab(value)}
            className="min-w-24 rounded-t-xl px-5 py-3 text-sm font-semibold text-white/85 transition hover:text-white aria-selected:bg-white aria-selected:text-marinho-950 sm:min-w-28"
          >
            {label}
          </button>
        ))}
      </div>

      <div
        id="busca-painel"
        role="tabpanel"
        aria-labelledby={`busca-aba-${tab}`}
        className="rounded-2xl rounded-tl-none bg-white p-4 shadow-2xl shadow-marinho-950/20 sm:p-5"
      >
        {tab === "list" ? (
          <div className="flex flex-col gap-4 py-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-marinho-950">Quer vender ou alugar seu imóvel?</p>
              <p className="mt-1 text-sm text-grafite-600">
                A Marinho cuida de tudo: avaliação, anúncio, visitas, contrato e documentação.
              </p>
            </div>
            <a
              href={listPropertyHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-dourado-400 px-6 py-3 text-sm font-semibold text-marinho-950 transition hover:bg-dourado-300"
            >
              <WhatsappIcon className="size-4" /> Anunciar meu imóvel
            </a>
          </div>
        ) : (
          <Form action={deal === "rent" ? "/alugar" : "/comprar"} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <div>
              <label htmlFor="busca-bairro" className="mb-1.5 block text-xs font-semibold text-marinho-950">Bairro</label>
              <select key={`bairro-${deal}`} id="busca-bairro" name="bairro" defaultValue="" className={select}>
                <option value="">Todos os bairros</option>
                {neighborhoods[deal].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="busca-tipo" className="mb-1.5 block text-xs font-semibold text-marinho-950">Tipo de imóvel</label>
              <select id="busca-tipo" name="tipo" defaultValue="" className={select}>
                <option value="">Todos os tipos</option>
                {PROPERTY_TYPES.filter((t) => t !== "outro").map((t) => (
                  <option key={t} value={t}>{PROPERTY_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="busca-preco" className="mb-1.5 block text-xs font-semibold text-marinho-950">
                {deal === "rent" ? "Valor do aluguel" : "Valor"}
              </label>
              <select key={`preco-${deal}`} id="busca-preco" name="preco" defaultValue="" className={select}>
                <option value="">Qualquer valor</option>
                {PRICE_RANGES[deal].map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-lg bg-dourado-400 px-6 py-3 text-sm font-semibold text-marinho-950 transition hover:bg-dourado-300"
            >
              <Search className="size-4" aria-hidden /> Buscar imóveis
            </button>
          </Form>
        )}
      </div>
    </div>
  );
}
