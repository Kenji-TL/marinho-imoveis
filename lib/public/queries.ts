import "server-only";

import type { Tables } from "@/lib/database.types";
import type { DealType } from "@/lib/property-options";
import { photoUrl, smallPhotoUrl } from "@/lib/photos";
import { createPublicClient } from "@/lib/supabase/public";

// Dados do site público. São lidos uma vez a cada publicação (build), pela
// função site_snapshot() do banco, e viram páginas prontas. Os visitantes
// não consultam o banco.

export type SiteSettings = Tables<"settings">;

type SnapshotImage = { id: string; storage_path: string; width: number | null; height: number | null; is_cover: boolean };
type SnapshotProperty = Omit<Tables<"properties">, "search_text"> & { images: SnapshotImage[] };
type Snapshot = { settings: SiteSettings; properties: SnapshotProperty[] };

export type Photo = { id: string; url: string; thumb: string; width: number | null; height: number | null };

export type PropertyCardData = Pick<
  SnapshotProperty,
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
> & { cover: Photo | null };

export type PublicProperty = Omit<SnapshotProperty, "images"> & { images: Photo[] };

// Uma leitura do banco serve todas as páginas geradas em seguida
let memo: { at: number; promise: Promise<Snapshot> } | null = null;

function snapshot(): Promise<Snapshot> {
  if (memo && Date.now() - memo.at < 10_000) return memo.promise;
  const promise = (async () => {
    const { data, error } = await createPublicClient().rpc("site_snapshot");
    if (error) throw new Error(`Erro ao carregar os dados do site: ${error.message}`);
    return data as unknown as Snapshot;
  })();
  memo = { at: Date.now(), promise };
  promise.catch(() => (memo = null));
  return promise;
}

function toPhoto(img: SnapshotImage): Photo {
  return { id: img.id, url: photoUrl(img.storage_path), thumb: smallPhotoUrl(img.storage_path), width: img.width, height: img.height };
}

function toCard({ images, ...p }: SnapshotProperty): PropertyCardData {
  const cover = images.find((i) => i.is_cover) ?? images[0];
  return {
    id: p.id,
    slug: p.slug,
    code: p.code,
    title: p.title,
    deal_type: p.deal_type,
    property_type: p.property_type,
    status: p.status,
    neighborhood: p.neighborhood,
    city: p.city,
    rent_price: p.rent_price,
    sale_price: p.sale_price,
    condo_fee: p.condo_fee,
    iptu: p.iptu,
    iptu_exempt: p.iptu_exempt,
    bedrooms: p.bedrooms,
    suites: p.suites,
    bathrooms: p.bathrooms,
    parking_spots: p.parking_spots,
    usable_area: p.usable_area,
    total_area: p.total_area,
    accepts_proposal: p.accepts_proposal,
    featured: p.featured,
    created_at: p.created_at,
    cover: cover ? toPhoto(cover) : null,
  };
}

const byUpdated = (a: SnapshotProperty, b: SnapshotProperty) => b.updated_at.localeCompare(a.updated_at);

// ---------------------------------------------------------------- Configurações

export async function getSettings(): Promise<SiteSettings> {
  return (await snapshot()).settings;
}

// ---------------------------------------------------------------- Listagens

export async function getFeaturedProperties(limit = 6): Promise<PropertyCardData[]> {
  const all = [...(await snapshot()).properties].sort(byUpdated);
  // Destaques primeiro; completa com os mais recentes
  let rows = [...all.filter((p) => p.featured), ...all.filter((p) => !p.featured)].slice(0, limit);
  // Fecha linhas inteiras de 4 na vitrine (a listagem completa mostra o resto)
  if (rows.length > 4) rows = rows.slice(0, rows.length - (rows.length % 4));
  return rows.map(toCard);
}

/** Todos os imóveis anunciados de um tipo de negócio, do mais novo para o mais antigo */
export async function getDealCards(deal: DealType): Promise<PropertyCardData[]> {
  return (await snapshot()).properties.filter((p) => p.deal_type === deal).map(toCard);
}

/** Bairros que têm imóveis anunciados, por tipo de negócio */
export async function getNeighborhoods(): Promise<Record<DealType, string[]>> {
  const result: Record<DealType, Set<string>> = { rent: new Set(), sale: new Set() };
  for (const p of (await snapshot()).properties) result[p.deal_type].add(p.neighborhood);
  const sorted = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return { rent: sorted(result.rent), sale: sorted(result.sale) };
}

// ---------------------------------------------------------------- Imóvel

export async function getPropertyBySlug(slug: string): Promise<PublicProperty | null> {
  const row = (await snapshot()).properties.find((p) => p.slug === slug);
  return row ? { ...row, images: row.images.map(toPhoto) } : null;
}

export async function getSimilarProperties(
  property: Pick<PublicProperty, "id" | "deal_type" | "neighborhood" | "property_type" | "rent_price" | "sale_price">,
  limit = 3,
): Promise<PropertyCardData[]> {
  const price = (p: { rent_price: number | null; sale_price: number | null }) =>
    (property.deal_type === "rent" ? p.rent_price : p.sale_price) ?? 0;
  const ref = price(property) || 1;
  const score = (r: SnapshotProperty) =>
    (r.neighborhood === property.neighborhood ? 3 : 0) +
    (r.property_type === property.property_type ? 2 : 0) +
    (Math.abs(price(r) - ref) / ref < 0.35 ? 1 : 0);

  return (await snapshot()).properties
    .filter((r) => r.deal_type === property.deal_type && r.id !== property.id)
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit)
    .map(toCard);
}

/** Endereços das páginas de imóvel geradas na publicação */
export async function getPublishedSlugs(): Promise<string[]> {
  return (await snapshot()).properties.map((p) => p.slug);
}

/** Código → endereço atual, para levar links antigos (título mudou) ao endereço novo */
export async function getSlugsByCode(): Promise<Record<string, string>> {
  return Object.fromEntries((await snapshot()).properties.map((p) => [p.code.toLowerCase(), p.slug]));
}
