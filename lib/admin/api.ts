// Dados e ações do painel. Roda no navegador: o banco só deixa a equipe ler
// e alterar os imóveis e as fotos (RLS) e só o dono mexer nas configurações
// e na equipe. O que precisa de chave secreta (criar e remover acessos,
// publicar o site) passa pelo serviço do painel na Cloudflare (/api).

import { z } from "zod";
import type { Tables, TablesInsert } from "@/lib/database.types";
import { slugify } from "@/lib/format";
import { bothVersions, PHOTOS_BUCKET, photoUrl, smallPath, storageSmallPhotoUrl } from "@/lib/photos";
import type { DealType, PropertyStatus } from "@/lib/property-options";
import { createClient } from "@/lib/supabase/client";
import { propertySchema, toFieldErrors, type FieldErrors } from "@/lib/validation/property";
import { settingsSchema } from "@/lib/validation/settings";
import { authErrorMessage, changePasswordSchema, firstErrors, memberSchema, newPasswordSchema } from "@/lib/validation/team";
import type { TeamRole } from "./roles";

const db = () => createClient();

function loadError(what: string, message: string): never {
  throw new Error(`Erro ao carregar ${what}: ${message}`);
}

// ---------------------------------------------------------------- Serviço do painel (/api)

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await db().auth.getSession();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/${path}`, {
      ...init,
      headers: { ...init.headers, authorization: `Bearer ${data.session?.access_token ?? ""}` },
    });
  } catch {
    throw new ApiError("Sem conexão. Verifique a internet.", 0);
  }
  const body = (await res.json().catch(() => null)) as (T & { message?: string }) | null;
  if (!res.ok) throw new ApiError(body?.message ?? "Não foi possível falar com o servidor do painel.", res.status);
  return body as T;
}

const postJson = <T>(path: string, payload: unknown) =>
  api<T>(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });

// ---------------------------------------------------------------- Publicação do site

export type PublishStatus = {
  configured: boolean;
  state: "idle" | "running" | "failed";
  updated_at: string | null;
};

/** ok: pedido feito · off: publicação automática não configurada · falha: não deu para pedir */
export type PublishOutcome = "ok" | "off" | "falha";

/** Pede para gerar o site de novo (leva uns 3 minutos para aparecer) */
export async function publishSite(): Promise<PublishOutcome> {
  try {
    const { configured } = await postJson<{ configured: boolean }>("publicar", {});
    if (!configured) return "off";
    window.dispatchEvent(new Event("site:publicando"));
    return "ok";
  } catch {
    return "falha";
  }
}

export const getPublishStatus = () => api<PublishStatus>("publicar");

export const PUBLISH_NOTE: Record<PublishOutcome, string> = {
  ok: "O site atualiza em uns 3 minutos.",
  off: "A publicação automática do site ainda não foi configurada (veja o README).",
  falha: "Não foi possível atualizar o site agora. Salve de novo em alguns minutos.",
};

// ---------------------------------------------------------------- Fotos (Storage)

const photos = () => db().storage.from(PHOTOS_BUCKET);

/** Envia as duas versões da foto (a pequena primeiro: a grande só conta quando as duas chegaram) */
export async function uploadPhoto(path: string, large: Blob, small: Blob) {
  const options = { contentType: "image/jpeg", cacheControl: "31536000", upsert: true };
  for (const [key, blob] of [[smallPath(path), small], [path, large]] as const) {
    const { error } = await photos()
      .upload(key, blob, options)
      .catch((e: unknown) => ({ error: e instanceof Error ? e : new Error(String(e)) }));
    if (error) {
      throw new ApiError(/fetch|network|load failed/i.test(error.message) ? "Sem conexão. Verifique a internet." : error.message, 0);
    }
  }
}

/** Apaga do Storage as duas versões (se falhar, a limpeza diária apaga depois) */
async function deletePhotos(paths: string[]) {
  if (paths.length) await photos().remove(bothVersions(paths)).catch(() => {});
}

/** Apaga uma foto enviada e retirada antes de salvar o imóvel */
export async function discardUploadedPhoto(propertyId: string, storagePath: string) {
  if (!storagePath.startsWith(`${propertyId}/`)) return;
  // Só apaga se a foto ainda não estiver cadastrada em nenhum imóvel
  const { data } = await db().from("property_images").select("id").eq("storage_path", storagePath).maybeSingle();
  if (!data) await deletePhotos([storagePath]);
}

// ---------------------------------------------------------------- Imóveis: leitura

export type DashboardStats = { total: number; rent: number; sale: number; available: number };

export async function getDashboardStats(): Promise<DashboardStats> {
  const count = () => db().from("properties").select("id", { count: "exact", head: true });
  const [total, rent, sale, available] = await Promise.all([
    count(),
    count().eq("deal_type", "rent"),
    count().eq("deal_type", "sale"),
    count().eq("status", "available"),
  ]);
  const failed = [total, rent, sale, available].find((r) => r.error);
  if (failed?.error) loadError("o painel", failed.error.message);
  return { total: total.count ?? 0, rent: rent.count ?? 0, sale: sale.count ?? 0, available: available.count ?? 0 };
}

const LIST_COLUMNS =
  "id, code, slug, title, deal_type, property_type, status, visible, featured, rent_price, sale_price, neighborhood, city, updated_at, property_images(storage_path, is_cover, position)";

export type PropertyListItem = Pick<
  Tables<"properties">,
  | "id"
  | "code"
  | "slug"
  | "title"
  | "deal_type"
  | "property_type"
  | "status"
  | "visible"
  | "featured"
  | "rent_price"
  | "sale_price"
  | "neighborhood"
  | "city"
  | "updated_at"
> & { cover_url: string | null };

export type PropertyListFilters = {
  q?: string;
  deal?: DealType;
  status?: PropertyStatus;
  visibility?: "visible" | "hidden";
  page?: number;
};

export const PAGE_SIZE = 20;

type ListRow = Omit<PropertyListItem, "cover_url"> & {
  property_images: { storage_path: string; is_cover: boolean; position: number }[];
};

function withCover({ property_images, ...rest }: ListRow): PropertyListItem {
  const cover = property_images.find((i) => i.is_cover) ?? [...property_images].sort((a, b) => a.position - b.position)[0];
  return { ...rest, cover_url: cover ? storageSmallPhotoUrl(cover.storage_path) : null };
}

export async function listProperties(filters: PropertyListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  let query = db()
    .from("properties")
    .select(LIST_COLUMNS, { count: "exact" })
    .order("updated_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const term = slugify(filters.q ?? "");
  if (term) query = query.ilike("search_text", `%${term}%`);
  if (filters.deal) query = query.eq("deal_type", filters.deal);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.visibility) query = query.eq("visible", filters.visibility === "visible");

  const { data, count, error } = await query.overrideTypes<ListRow[], { merge: false }>();
  if (error) loadError("os imóveis", error.message);
  const total = count ?? 0;
  return { items: (data ?? []).map(withCover), total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getRecentProperties(limit = 5): Promise<PropertyListItem[]> {
  const { data, error } = await db()
    .from("properties")
    .select(LIST_COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(limit)
    .overrideTypes<ListRow[], { merge: false }>();
  if (error) loadError("os imóveis", error.message);
  return (data ?? []).map(withCover);
}

export type PropertyForEdit = Tables<"properties"> & { images: Tables<"property_images">[] };

export async function getPropertyForEdit(id: string): Promise<PropertyForEdit | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await db()
    .from("properties")
    .select("*, images:property_images(*)")
    .eq("id", id)
    .order("position", { referencedTable: "property_images", ascending: true })
    .maybeSingle()
    .overrideTypes<PropertyForEdit, { merge: false }>();
  if (error) loadError("o imóvel", error.message);
  return data;
}

/** Bairros já usados, para sugerir no formulário e manter os nomes iguais */
export async function getKnownNeighborhoods(): Promise<string[]> {
  const { data } = await db().from("properties").select("neighborhood").limit(1000);
  return [...new Set((data ?? []).map((r) => r.neighborhood))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

// ---------------------------------------------------------------- Imóveis: ações

export type SaveResult =
  | { ok: true; id: string; code: string; slug: string; created: boolean; publish: PublishOutcome }
  | { ok: false; message: string; errors?: FieldErrors };

type ImageInput = { id: string; storage_path: string; position: number; is_cover: boolean; width: number | null; height: number | null };

/** Aplica a lista final de fotos e apaga do Storage os arquivos removidos */
async function syncImages(propertyId: string, images: ImageInput[]) {
  const payload = images.map((img, index) => ({ ...img, position: index, url: photoUrl(img.storage_path) }));
  const { data: removed, error } = await db().rpc("sync_property_images", { p_property_id: propertyId, p_images: payload });
  if (error) return error.message;
  // Se falhar, sobra só um arquivo solto (a limpeza diária apaga); o imóvel já está certo
  await deletePhotos(removed ?? []);
  return null;
}

export async function saveProperty(input: unknown): Promise<SaveResult> {
  const parsed = propertySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Confira os campos destacados.", errors: toFieldErrors(parsed.error) };

  const { id, images, ...fields } = parsed.data;
  const row = {
    ...fields,
    rent_price: fields.deal_type === "rent" ? fields.rent_price : null,
    sale_price: fields.deal_type === "sale" ? fields.sale_price : null,
    iptu: fields.iptu_exempt ? null : fields.iptu,
  } satisfies Omit<TablesInsert<"properties">, "id">;

  const { data: existing } = await db().from("properties").select("id").eq("id", id).maybeSingle();
  const query = existing ? db().from("properties").update(row).eq("id", id) : db().from("properties").insert({ id, ...row });
  const { data: saved, error } = await query.select("id, code, slug").single();
  if (error) return { ok: false, message: `Não foi possível salvar o imóvel: ${error.message}` };

  const imagesError = await syncImages(id, images);
  if (imagesError) {
    return { ok: false, message: `Os dados foram salvos, mas houve um erro com as fotos: ${imagesError}. Tente salvar de novo.` };
  }

  const publish = await publishSite();
  return { ok: true, id: saved.id, code: saved.code, slug: saved.slug, created: !existing, publish };
}

export async function duplicateProperty(id: string): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const { data: original, error } = await db()
    .from("properties")
    .select("*, property_images(*)")
    .eq("id", id)
    .order("position", { referencedTable: "property_images", ascending: true })
    .single();
  if (error || !original) return { ok: false, message: "Imóvel não encontrado." };

  const {
    id: _id,
    code: _code,
    slug: _slug,
    search_text: _search,
    created_at: _created,
    updated_at: _updated,
    status_changed_at: _statusChanged,
    property_images: images,
    ...fields
  } = original;

  const newId = crypto.randomUUID();
  const { error: insertError } = await db()
    .from("properties")
    .insert({
      ...fields,
      id: newId,
      title: `${fields.title} (cópia)`.slice(0, 140),
      status: "available",
      visible: false, // a cópia só aparece no site depois de revisada
      featured: false,
    });
  if (insertError) return { ok: false, message: `Não foi possível duplicar: ${insertError.message}` };

  const copies = images.map((image, position) => ({
    from: image.storage_path,
    image: {
      id: crypto.randomUUID(),
      storage_path: "",
      position,
      is_cover: image.is_cover,
      width: image.width,
      height: image.height,
    },
  }));
  for (const c of copies) c.image.storage_path = `${newId}/${c.image.id}.jpg`;

  if (copies.length) {
    const copied = await Promise.all(
      copies.map(async (c) => {
        const results = await Promise.all([
          photos().copy(c.from, c.image.storage_path),
          photos().copy(smallPath(c.from), smallPath(c.image.storage_path)),
        ]);
        return results[0].error ? null : c.image;
      }),
    );
    const kept = copied.filter((img) => img !== null);
    if (kept.length) await syncImages(newId, kept);
  }
  // A cópia fica oculta: não muda nada no site
  return { ok: true, id: newId };
}

export async function setPropertyVisibility(id: string, visible: boolean) {
  const { error } = await db().from("properties").update({ visible }).eq("id", id);
  if (error) return { ok: false as const, message: `Não foi possível alterar: ${error.message}` };
  await publishSite();
  return { ok: true as const };
}

export async function deleteProperty(id: string) {
  const { data: images } = await db().from("property_images").select("storage_path").eq("property_id", id);
  const { error } = await db().from("properties").delete().eq("id", id);
  if (error) return { ok: false as const, message: `Não foi possível excluir: ${error.message}` };
  await deletePhotos((images ?? []).map((i) => i.storage_path));
  await publishSite();
  return { ok: true as const };
}

// ---------------------------------------------------------------- Configurações (dono)

export async function getSettingsForAdmin(): Promise<Tables<"settings">> {
  const { data, error } = await db().from("settings").select("*").eq("id", 1).single();
  if (error) loadError("as configurações", error.message);
  return data;
}

export type SettingsState =
  | { ok: true; message: string; savedAt: number }
  | { ok: false; message: string; errors: Partial<Record<string, string>>; values: Record<string, string> }
  | undefined;

const SETTINGS_FIELDS = [
  "company_name",
  "whatsapp",
  "phone",
  "email",
  "creci",
  "address",
  "opening_hours",
  "instagram_url",
  "facebook_url",
  "about_text",
] as const;

export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const values = Object.fromEntries(SETTINGS_FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) {
    const errors: Partial<Record<string, string>> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: "Confira os campos destacados.", errors, values };
  }
  const { data, error } = await db().from("settings").update(parsed.data).eq("id", 1).select("id");
  if (error || !data?.length) {
    return { ok: false, message: `Não foi possível salvar: ${error?.message ?? "só o dono pode alterar."}`, errors: {}, values };
  }
  return { ok: true, message: `Configurações salvas. ${PUBLISH_NOTE[await publishSite()]}`, savedAt: Date.now() };
}

// ---------------------------------------------------------------- Login e conta

export type LoginState = { error: string; email: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Informe o e-mail e a senha.", email };

  const { error } = await db().auth.signInWithPassword({ email, password });
  if (error) {
    const message =
      error.code === "invalid_credentials"
        ? "E-mail ou senha incorretos."
        : error.code === "over_request_rate_limit"
          ? "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo."
          : "Não foi possível entrar agora. Tente novamente.";
    return { error: message, email };
  }

  const { data: isAdmin } = await db().rpc("is_admin");
  if (!isAdmin) {
    await db().auth.signOut();
    return { error: "Esta conta não tem acesso ao painel.", email };
  }
  return undefined;
}

export type ResetState = { ok: boolean; message: string; email: string } | undefined;

/** Endereço que os links de e-mail (convite e senha) abrem */
export const accessLinkRedirect = () => `${window.location.origin}/auth/confirm?next=/admin/definir-senha`;

/** "Esqueci minha senha": envia o link por e-mail sem revelar se a conta existe */
export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!z.email().safeParse(email).success) return { ok: false, message: "Informe um e-mail válido.", email };

  const { error } = await db().auth.resetPasswordForEmail(email, { redirectTo: accessLinkRedirect() });
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return { ok: false, message: "Muitos pedidos seguidos. Aguarde alguns minutos e tente de novo.", email };
  }
  return {
    ok: true,
    message: `Se ${email} tiver acesso ao painel, chega em instantes um e-mail com o link para criar uma senha nova. Confira também o spam.`,
    email,
  };
}

export type NewPasswordState = { ok?: boolean; message: string; errors: Partial<Record<string, string>> } | undefined;

/** Página aberta pelo link do e-mail (convite ou recuperação): define a senha */
export async function setNewPassword(_prev: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const parsed = newPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) return { message: "Confira os campos destacados.", errors: firstErrors(parsed.error) };
  const { error } = await db().auth.updateUser({ password: parsed.data.password });
  if (error) return { message: authErrorMessage(error), errors: {} };
  return { ok: true, message: "", errors: {} };
}

export type AccountState =
  | { ok: true; message: string; at: number }
  | { ok: false; message: string; errors?: Partial<Record<string, string>> }
  | undefined;

const nameSchema = z.string().trim().min(2, "Informe seu nome.").max(80, "Use no máximo 80 caracteres.");

export async function updateMyName(userId: string, formData: FormData): Promise<AccountState> {
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message, errors: { name: parsed.error.issues[0].message } };
  const { error } = await db().from("admins").update({ name: parsed.data }).eq("user_id", userId);
  if (error) return { ok: false, message: `Não foi possível salvar: ${error.message}` };
  return { ok: true, message: "Nome atualizado.", at: Date.now() };
}

export async function changeMyPassword(email: string, formData: FormData): Promise<AccountState> {
  const parsed = changePasswordSchema.safeParse({
    current: String(formData.get("current") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Confira os campos destacados.", errors: firstErrors(parsed.error) };

  // Confere a senha atual (renova a mesma sessão, sem sair do painel)
  const { error: wrong } = await db().auth.signInWithPassword({ email, password: parsed.data.current });
  if (wrong) return { ok: false, message: "A senha atual está incorreta.", errors: { current: "Senha atual incorreta." } };

  const { error } = await db().auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: authErrorMessage(error) };
  return { ok: true, message: "Senha alterada. Use a nova senha no próximo acesso.", at: Date.now() };
}

// ---------------------------------------------------------------- Equipe (dono)

export type TeamMember = Tables<"admins"> & {
  status: "ativo" | "convite-pendente" | null;
  last_sign_in_at: string | null;
};

export type TeamResult = { ok: true; message: string } | { ok: false; message: string; errors?: Partial<Record<string, string>> };

const toTeamResult = (e: unknown): TeamResult => ({ ok: false, message: e instanceof Error ? e.message : "Algo deu errado." });

/** Equipe e situação de cada acesso. canManage = o serviço do painel está configurado. */
export async function getTeam(): Promise<{ members: TeamMember[]; canManage: boolean }> {
  try {
    const { members } = await api<{ members: TeamMember[] }>("equipe");
    return { members, canManage: true };
  } catch (e) {
    if (e instanceof ApiError && e.status === 403) throw e;
    // Sem o serviço do painel: mostra a lista do banco, sem criar nem remover acessos
    const { data, error } = await db().from("admins").select("*").order("created_at", { ascending: true });
    if (error) loadError("a equipe", error.message);
    return { members: (data ?? []).map((m) => ({ ...m, status: null, last_sign_in_at: null })), canManage: false };
  }
}

/** Adiciona uma pessoa à equipe, por convite no e-mail ou com senha provisória */
export async function addMember(input: unknown): Promise<TeamResult> {
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Confira os campos destacados.", errors: firstErrors(parsed.error) };
  try {
    return await postJson<TeamResult>("equipe/adicionar", parsed.data);
  } catch (e) {
    return toTeamResult(e);
  }
}

function friendlyDbError(message: string) {
  return /pelo menos um dono/i.test(message) ? "O painel precisa ter pelo menos um dono." : `Não foi possível concluir: ${message}`;
}

export async function changeMemberRole(userId: string, role: TeamRole): Promise<TeamResult> {
  if (role !== "dono" && role !== "corretor") return { ok: false, message: "Acesso inválido." };
  const { error } = await db().from("admins").update({ role }).eq("user_id", userId);
  if (error) return { ok: false, message: friendlyDbError(error.message) };
  return { ok: true, message: role === "dono" ? "Agora essa pessoa é dona." : "Agora essa pessoa é corretora." };
}

export async function removeMember(userId: string): Promise<TeamResult> {
  try {
    return await postJson<TeamResult>("equipe/remover", { userId });
  } catch (e) {
    return toTeamResult(e);
  }
}

/** Envia por e-mail um link para a pessoa (re)definir a senha */
export async function sendAccessLink(userId: string): Promise<TeamResult> {
  const { data: member } = await db().from("admins").select("email").eq("user_id", userId).maybeSingle();
  if (!member?.email) return { ok: false, message: "Não encontramos o e-mail dessa pessoa." };
  const { error } = await db().auth.resetPasswordForEmail(member.email, { redirectTo: accessLinkRedirect() });
  if (error) return { ok: false, message: authErrorMessage(error) };
  return { ok: true, message: `Enviamos para ${member.email} um link para criar uma senha nova.` };
}
