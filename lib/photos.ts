// Fotos dos imóveis, guardadas no Storage do Supabase (bucket property-images).
// Cada foto é guardada em duas versões, no mesmo caminho:
//   <imóvel>/<foto>.jpg     grande (até 1600 px), para a galeria
//   <imóvel>/<foto>-p.jpg   pequena (até 640 px), para cards e miniaturas
// O banco guarda só o caminho (storage_path) da versão grande.
//
// No site publicado, as fotos dos imóveis anunciados viram arquivos do próprio
// site (/fotos/...), copiados na publicação (scripts/baixar-fotos.mjs). Assim a
// Cloudflare entrega as fotos como entrega as páginas: de graça e sem limite.
// O painel (e o `npm run dev`) mostra as fotos direto do Storage.

export const PHOTOS_BUCKET = "property-images";

const STORAGE_BASE = `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/storage/v1/object/public/${PHOTOS_BUCKET}`;
const SITE_BASE = process.env.NODE_ENV === "development" ? STORAGE_BASE : "/fotos";

export const PHOTO_PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/;

export function smallPath(storagePath: string) {
  return storagePath.replace(/\.jpg$/, "-p.jpg");
}

/** Caminhos das duas versões de cada foto (para apagar, copiar ou baixar) */
export function bothVersions(storagePaths: string[]) {
  return storagePaths.flatMap((p) => [p, smallPath(p)]);
}

/** Endereço da foto no site publicado */
export function photoUrl(storagePath: string) {
  return `${SITE_BASE}/${storagePath}`;
}

export function smallPhotoUrl(storagePath: string) {
  return photoUrl(smallPath(storagePath));
}

/** Endereço da foto direto no Storage (painel: a foto pode ainda não estar publicada) */
export function storageSmallPhotoUrl(storagePath: string) {
  return `${STORAGE_BASE}/${smallPath(storagePath)}`;
}
