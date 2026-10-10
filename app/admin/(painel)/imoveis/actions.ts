"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { TablesInsert } from "@/lib/database.types";
import { PHOTOS_BUCKET } from "@/lib/property-options";
import { sanitizeDescription } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/server";
import { propertySchema, toFieldErrors, type FieldErrors } from "@/lib/validation/property";

export type SaveResult =
  | { ok: true; id: string; code: string; slug: string; created: boolean }
  | { ok: false; message: string; errors?: FieldErrors };

type Supabase = Awaited<ReturnType<typeof createClient>>;

function invalidatePublicCache() {
  updateTag(CACHE_TAGS.properties);
}

function publicUrl(supabase: Supabase, path: string) {
  return supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Aplica a lista final de fotos e apaga do Storage os arquivos removidos */
async function syncImages(
  supabase: Supabase,
  propertyId: string,
  images: { id: string; storage_path: string; position: number; is_cover: boolean; width: number | null; height: number | null }[],
) {
  const payload = images.map((img, index) => ({
    ...img,
    position: index,
    url: publicUrl(supabase, img.storage_path),
  }));
  const { data: removed, error } = await supabase.rpc("sync_property_images", {
    p_property_id: propertyId,
    p_images: payload,
  });
  if (error) return error.message;
  if (removed?.length) {
    // Se falhar, sobra só um arquivo solto no Storage; o imóvel já está certo
    await supabase.storage.from(PHOTOS_BUCKET).remove(removed);
  }
  return null;
}

export async function saveProperty(input: unknown): Promise<SaveResult> {
  await requireAdmin();

  const parsed = propertySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Confira os campos destacados.",
      errors: toFieldErrors(parsed.error),
    };
  }

  const { id, images, ...fields } = parsed.data;
  const row = {
    ...fields,
    rent_price: fields.deal_type === "rent" ? fields.rent_price : null,
    sale_price: fields.deal_type === "sale" ? fields.sale_price : null,
    iptu: fields.iptu_exempt ? null : fields.iptu,
    description: sanitizeDescription(fields.description),
  } satisfies Omit<TablesInsert<"properties">, "id">;

  const supabase = await createClient();
  const { data: existing } = await supabase.from("properties").select("id").eq("id", id).maybeSingle();

  const query = existing
    ? supabase.from("properties").update(row).eq("id", id)
    : supabase.from("properties").insert({ id, ...row });
  const { data: saved, error } = await query.select("id, code, slug").single();

  if (error) {
    return { ok: false, message: `Não foi possível salvar o imóvel: ${error.message}` };
  }

  const imagesError = await syncImages(supabase, id, images);
  invalidatePublicCache();

  if (imagesError) {
    return {
      ok: false,
      message: `Os dados foram salvos, mas houve um erro com as fotos: ${imagesError}. Tente salvar de novo.`,
    };
  }

  return { ok: true, id: saved.id, code: saved.code, slug: saved.slug, created: !existing };
}

export async function duplicateProperty(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: original, error } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("id", id)
    .order("position", { referencedTable: "property_images", ascending: true })
    .single();
  if (error || !original) {
    return { ok: false as const, message: "Imóvel não encontrado." };
  }

  const { id: _id, code: _code, slug: _slug, search_text: _search, created_at: _created, updated_at: _updated, property_images: images, ...fields } =
    original;

  const newId = randomUUID();
  const { error: insertError } = await supabase.from("properties").insert({
    ...fields,
    id: newId,
    title: `${fields.title} (cópia)`.slice(0, 140),
    status: "available",
    visible: false, // a cópia só aparece no site depois de revisada
    featured: false,
  });
  if (insertError) {
    return { ok: false as const, message: `Não foi possível duplicar: ${insertError.message}` };
  }

  const copies = [];
  for (const image of images) {
    const imageId = randomUUID();
    const path = `${newId}/${imageId}.jpg`;
    const { error: copyError } = await supabase.storage.from(PHOTOS_BUCKET).copy(image.storage_path, path);
    if (copyError) continue;
    copies.push({
      id: imageId,
      storage_path: path,
      position: copies.length,
      is_cover: image.is_cover,
      width: image.width,
      height: image.height,
    });
  }
  if (copies.length) await syncImages(supabase, newId, copies);

  invalidatePublicCache();
  redirect(`/admin/imoveis/${newId}?aviso=duplicado`);
}

export async function setPropertyVisibility(id: string, visible: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("properties").update({ visible }).eq("id", id);
  if (error) return { ok: false as const, message: `Não foi possível alterar: ${error.message}` };
  invalidatePublicCache();
  return { ok: true as const };
}

export async function deleteProperty(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: images } = await supabase
    .from("property_images")
    .select("storage_path")
    .eq("property_id", id);

  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) return { ok: false as const, message: `Não foi possível excluir: ${error.message}` };

  const paths = (images ?? []).map((i) => i.storage_path);
  if (paths.length) await supabase.storage.from(PHOTOS_BUCKET).remove(paths);

  invalidatePublicCache();
  return { ok: true as const };
}

/** Apaga do Storage uma foto enviada e retirada antes de salvar o imóvel */
export async function discardUploadedPhoto(propertyId: string, storagePath: string) {
  await requireAdmin();
  if (!storagePath.startsWith(`${propertyId}/`)) return;
  const supabase = await createClient();
  // Só apaga se a foto ainda não estiver cadastrada em nenhum imóvel
  const { data } = await supabase
    .from("property_images")
    .select("id")
    .eq("storage_path", storagePath)
    .maybeSingle();
  if (!data) await supabase.storage.from(PHOTOS_BUCKET).remove([storagePath]);
}
