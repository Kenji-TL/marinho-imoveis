import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { Tables } from "@/lib/database.types";
import type { DealType } from "@/lib/property-options";
import { createPublicClient } from "@/lib/supabase/public";
import { PRICE_RANGES, type ListingFilters } from "./listing-params";

// Dados públicos do site. Tudo fica em cache e é renovado quando o painel salva
// (updateTag nas ações do painel) ou, no máximo, a cada hora.

const LISTED_STATUSES = ["available", "reserved"] as const;
export const LISTING_PAGE_SIZE = 12;

const CARD_COLUMNS =
  "id, slug, code, title, deal_type, property_type, status, neighborhood, city, rent_price, sale_price, condo_fee, iptu, iptu_exempt, bedrooms, suites, bathrooms, parking_spots, usable_area, total_area, accepts_proposal, featured, created_at, property_images(url, width, height, is_cover, position)";

type CardRow = Pick<
  Tables<"properties">,
  | "id"
  | "slug"
  | "code"
  | "title"
  | "deal_type"
  | "property_type"
  | "status"
  | "neighborhood"
  | "city"
  | "rent_price"
  | "sale_price"
  | "condo_fee"
  | "iptu"
  | "iptu_exempt"
  | "bedrooms"
  | "suites"
  | "bathrooms"
  | "parking_spots"
  | "usable_area"
  | "total_area"
  | "accepts_proposal"
  | "featured"
  | "created_at"
> & {
  property_images: Pick<Tables<"property_images">, "url" | "width" | "height" | "is_cover" | "position">[];
};

export type PropertyCardData = Omit<CardRow, "property_images"> & {
  cover: { url: string; width: number | null; height: number | null } | null;
};

function toCard({ property_images, ...row }: CardRow): PropertyCardData {
  const cover =
    property_images.find((i) => i.is_cover) ?? [...property_images].sort((a, b) => a.position - b.position)[0];
  return { ...row, cover: cover ? { url: cover.url, width: cover.width, height: cover.height } : null };
}

function fail(what: string, message: string): never {
  throw new Error(`Erro ao carregar ${what}: ${message}`);
}

// ---------------------------------------------------------------- Configurações

export type SiteSettings = Tables<"settings">;

export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(CACHE_TAGS.settings);
  cacheLife("hours");
  const { data, error } = await createPublicClient().from("settings").select("*").eq("id", 1).single();
  if (error) fail("as configurações", error.message);
  return data;
}

// ---------------------------------------------------------------- Listagens

export async function getFeaturedProperties(limit = 6): Promise<PropertyCardData[]> {
  "use cache";
  cacheTag(CACHE_TAGS.properties);
  cacheLife("hours");
  const supabase = createPublicClient();
  const base = () =>
    supabase.from("properties").select(CARD_COLUMNS).in("status", LISTED_STATUSES).order("updated_at", { ascending: false });

  const { data, error } = await base().eq("featured", true).limit(limit).overrideTypes<CardRow[], { merge: false }>();
  if (error) fail("os destaques", error.message);
  let rows = data ?? [];
  if (rows.length < limit) {
    // Completa com os mais recentes
    const { data: recent } = await base().limit(limit).overrideTypes<CardRow[], { merge: false }>();
    const ids = new Set(rows.map((r) => r.id));
    rows = [...rows, ...(recent ?? []).filter((r) => !ids.has(r.id))].slice(0, limit);
  }
  // Fecha linhas inteiras de 4 na vitrine (a listagem completa mostra o resto)
  if (rows.length > 4) rows = rows.slice(0, rows.length - (rows.length % 4));
  return rows.map(toCard);
}

export async function getDealCounts(): Promise<Record<DealType, number>> {
  "use cache";
  cacheTag(CACHE_TAGS.properties);
  cacheLife("hours");
  const supabase = createPublicClient();
  const count = (deal: DealType) =>
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("deal_type", deal).in("status", LISTED_STATUSES);
  const [rent, sale] = await Promise.all([count("rent"), count("sale")]);
  return { rent: rent.count ?? 0, sale: sale.count ?? 0 };
}

/** Bairros que têm imóveis anunciados, por tipo de negócio */
export async function getNeighborhoods(): Promise<Record<DealType, string[]>> {
  "use cache";
  cacheTag(CACHE_TAGS.properties);
  cacheLife("hours");
  const { data, error } = await createPublicClient()
    .from("properties")
    .select("neighborhood, deal_type")
    .in("status", LISTED_STATUSES)
    .limit(2000);
  if (error) fail("os bairros", error.message);
  const result: Record<DealType, Set<string>> = { rent: new Set(), sale: new Set() };
  for (const row of data ?? []) result[row.deal_type].add(row.neighborhood);
  const sorted = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return { rent: sorted(result.rent), sale: sorted(result.sale) };
}

export async function getListing(filters: ListingFilters) {
  "use cache";
  cacheTag(CACHE_TAGS.properties);
  cacheLife("hours");

  const priceColumn = filters.deal === "rent" ? "rent_price" : "sale_price";
  let query = createPublicClient()
    .from("properties")
    .select(CARD_COLUMNS, { count: "exact" })
    .eq("deal_type", filters.deal)
    .in("status", LISTED_STATUSES);

  if (filters.tipo) query = query.eq("property_type", filters.tipo);
  if (filters.bairro) query = query.eq("neighborhood", filters.bairro);
  if (filters.quartos) query = query.gte("bedrooms", filters.quartos);
  if (filters.vagas) query = query.gte("parking_spots", filters.vagas);
  const range = PRICE_RANGES[filters.deal].find((r) => r.key === filters.preco);
  if (range?.min != null) query = query.gt(priceColumn, range.min);
  if (range?.max != null) query = query.lte(priceColumn, range.max);

  if (filters.ordem === "menor-preco") query = query.order(priceColumn, { ascending: true });
  else if (filters.ordem === "maior-preco") query = query.order(priceColumn, { ascending: false });
  query = query.order("created_at", { ascending: false });

  const from = (filters.pagina - 1) * LISTING_PAGE_SIZE;
  const { data, count, error } = await query
    .range(from, from + LISTING_PAGE_SIZE - 1)
    .overrideTypes<CardRow[], { merge: false }>();
  if (error) fail("os imóveis", error.message);

  const total = count ?? 0;
  return {
    items: (data ?? []).map(toCard),
    total,
    pageCount: Math.max(1, Math.ceil(total / LISTING_PAGE_SIZE)),
  };
}

// ---------------------------------------------------------------- Imóvel

export type PublicProperty = Tables<"properties"> & {
  images: Pick<Tables<"property_images">, "id" | "url" | "width" | "height">[];
};

/**
 * Busca o imóvel pelo endereço da página. Se o título mudou (e com ele o slug),
 * acha pelo código no final do endereço e informa o endereço novo.
 */
export async function getPropertyBySlug(
  slug: string,
): Promise<{ property: PublicProperty; canonicalSlug: string } | null> {
  "use cache";
  cacheTag(CACHE_TAGS.properties);
  cacheLife("hours");

  type Row = Tables<"properties"> & { images: (PublicProperty["images"][number] & { position: number })[] };
  const supabase = createPublicClient();
  const findBy = (column: "slug" | "code", value: string) =>
    supabase
      .from("properties")
      .select("*, images:property_images(id, url, width, height, position)")
      .eq(column, value)
      .order("position", { referencedTable: "property_images", ascending: true })
      .limit(1)
      .overrideTypes<Row[], { merge: false }>();

  let { data } = await findBy("slug", slug);
  if (!data?.length) {
    const code = slug.match(/(mi-\d{4,})$/i)?.[1];
    if (!code) return null;
    ({ data } = await findBy("code", code.toUpperCase()));
  }
  const row = data?.[0];
  if (!row) return null;

  const images = [...row.images].sort((a, b) => a.position - b.position).map(({ id, url, width, height }) => ({ id, url, width, height }));
  // Número e complemento ocultos não saem do servidor
  const property: PublicProperty = row.hide_number
    ? { ...row, images, number: null, complement: null, zip_code: null }
    : { ...row, images };
  return { property, canonicalSlug: row.slug };
}

export async function getSimilarProperties(
  property: Pick<PublicProperty, "id" | "deal_type" | "neighborhood" | "property_type" | "rent_price" | "sale_price">,
  limit = 3,
): Promise<PropertyCardData[]> {
  "use cache";
  cacheTag(CACHE_TAGS.properties);
  cacheLife("hours");
  const { data } = await createPublicClient()
    .from("properties")
    .select(CARD_COLUMNS)
    .eq("deal_type", property.deal_type)
    .in("status", LISTED_STATUSES)
    .neq("id", property.id)
    .order("created_at", { ascending: false })
    .limit(40)
    .overrideTypes<CardRow[], { merge: false }>();

  const price = (p: { rent_price: number | null; sale_price: number | null }) =>
    (property.deal_type === "rent" ? p.rent_price : p.sale_price) ?? 0;
  const ref = price(property) || 1;
  const score = (r: CardRow) =>
    (r.neighborhood === property.neighborhood ? 3 : 0) +
    (r.property_type === property.property_type ? 2 : 0) +
    (Math.abs(price(r) - ref) / ref < 0.35 ? 1 : 0);

  return (data ?? [])
    .filter((r) => r.id !== property.id)
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit)
    .map(toCard);
}

/** Endereços pré-gerados no build (os demais são gerados na primeira visita) */
export async function getPublishedSlugs(limit = 200): Promise<string[]> {
  "use cache";
  cacheTag(CACHE_TAGS.properties);
  cacheLife("hours");
  const { data } = await createPublicClient()
    .from("properties")
    .select("slug")
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => r.slug);
}

