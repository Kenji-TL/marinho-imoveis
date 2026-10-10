import { PROPERTY_TYPES, type DealType, type PropertyType } from "@/lib/property-options";

export type PriceRange = { key: string; label: string; min?: number; max?: number };

/** Faixas de preço da busca (min exclusivo, max inclusivo) */
export const PRICE_RANGES: Record<DealType, PriceRange[]> = {
  rent: [
    { key: "ate-1000", label: "Até R$ 1.000", max: 1000 },
    { key: "1000-2000", label: "R$ 1.000 a R$ 2.000", min: 1000, max: 2000 },
    { key: "2000-3000", label: "R$ 2.000 a R$ 3.000", min: 2000, max: 3000 },
    { key: "3000-5000", label: "R$ 3.000 a R$ 5.000", min: 3000, max: 5000 },
    { key: "acima-5000", label: "Acima de R$ 5.000", min: 5000 },
  ],
  sale: [
    { key: "ate-200mil", label: "Até R$ 200 mil", max: 200_000 },
    { key: "200-400mil", label: "R$ 200 mil a R$ 400 mil", min: 200_000, max: 400_000 },
    { key: "400-700mil", label: "R$ 400 mil a R$ 700 mil", min: 400_000, max: 700_000 },
    { key: "700mil-1mi", label: "R$ 700 mil a R$ 1 milhão", min: 700_000, max: 1_000_000 },
    { key: "acima-1mi", label: "Acima de R$ 1 milhão", min: 1_000_000 },
  ],
};

export const SORT_OPTIONS = [
  { key: "recentes", label: "Mais recentes" },
  { key: "menor-preco", label: "Menor preço" },
  { key: "maior-preco", label: "Maior preço" },
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number]["key"];

export const MIN_OPTIONS = [1, 2, 3, 4] as const;

export type ListingFilters = {
  deal: DealType;
  tipo?: PropertyType;
  bairro?: string;
  preco?: string;
  quartos?: number;
  vagas?: number;
  ordem: SortKey;
  pagina: number;
};

type RawParams = Record<string, string | string[] | undefined>;

const str = (v: string | string[] | undefined) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const min = (v: string | string[] | undefined) => {
  const n = Number(str(v));
  return Number.isInteger(n) && n >= 1 && n <= 4 ? n : undefined;
};

/** Lê os filtros da URL, descartando valores inválidos */
export function parseListingParams(deal: DealType, params: RawParams): ListingFilters {
  const tipo = str(params.tipo);
  const preco = str(params.preco);
  const ordem = str(params.ordem);
  return {
    deal,
    tipo: tipo && (PROPERTY_TYPES as readonly string[]).includes(tipo) ? (tipo as PropertyType) : undefined,
    bairro: str(params.bairro)?.slice(0, 80),
    preco: preco && PRICE_RANGES[deal].some((r) => r.key === preco) ? preco : undefined,
    quartos: min(params.quartos),
    vagas: min(params.vagas),
    ordem: SORT_OPTIONS.some((o) => o.key === ordem) ? (ordem as SortKey) : "recentes",
    pagina: Math.max(1, Math.min(500, Number(str(params.pagina)) || 1)),
  };
}

/** Monta a URL da listagem com os filtros (sem os vazios) */
export function listingHref(filters: Partial<ListingFilters> & { deal: DealType }) {
  const qs = new URLSearchParams();
  if (filters.tipo) qs.set("tipo", filters.tipo);
  if (filters.bairro) qs.set("bairro", filters.bairro);
  if (filters.preco) qs.set("preco", filters.preco);
  if (filters.quartos) qs.set("quartos", String(filters.quartos));
  if (filters.vagas) qs.set("vagas", String(filters.vagas));
  if (filters.ordem && filters.ordem !== "recentes") qs.set("ordem", filters.ordem);
  if (filters.pagina && filters.pagina > 1) qs.set("pagina", String(filters.pagina));
  const s = qs.toString();
  return `${filters.deal === "rent" ? "/alugar" : "/comprar"}${s ? `?${s}` : ""}`;
}
