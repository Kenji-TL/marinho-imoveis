import "server-only";

import { requireAdmin, requireOwner } from "@/lib/auth";
import type { Tables } from "@/lib/database.types";
import { slugify } from "@/lib/format";
import type { DealType, PropertyStatus } from "@/lib/property-options";
import { createAdminClient, hasSecretKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DashboardStats = {
  total: number;
  rent: number;
  sale: number;
  available: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin();
  const supabase = await createClient();
  const count = () => supabase.from("properties").select("id", { count: "exact", head: true });

  const [total, rent, sale, available] = await Promise.all([
    count(),
    count().eq("deal_type", "rent"),
    count().eq("deal_type", "sale"),
    count().eq("status", "available"),
  ]);

  const failed = [total, rent, sale, available].find((r) => r.error);
  if (failed?.error) throw new Error(`Erro ao carregar o painel: ${failed.error.message}`);

  return {
    total: total.count ?? 0,
    rent: rent.count ?? 0,
    sale: sale.count ?? 0,
    available: available.count ?? 0,
  };
}

const LIST_COLUMNS =
  "id, code, slug, title, deal_type, property_type, status, visible, featured, rent_price, sale_price, neighborhood, city, updated_at, property_images(url, is_cover)";

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
  property_images: { url: string; is_cover: boolean }[];
};

function withCover(row: ListRow): PropertyListItem {
  const { property_images, ...rest } = row;
  const cover = property_images.find((i) => i.is_cover) ?? property_images[0];
  return { ...rest, cover_url: cover?.url ?? null };
}

export async function listProperties(filters: PropertyListFilters) {
  await requireAdmin();
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);

  let query = supabase
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
  if (error) throw new Error(`Erro ao carregar os imóveis: ${error.message}`);

  const total = count ?? 0;
  return {
    items: (data ?? []).map(withCover),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getRecentProperties(limit = 5): Promise<PropertyListItem[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(LIST_COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(limit)
    .overrideTypes<ListRow[], { merge: false }>();
  if (error) throw new Error(`Erro ao carregar os imóveis: ${error.message}`);
  return (data ?? []).map(withCover);
}

export type PropertyForEdit = Tables<"properties"> & {
  images: Tables<"property_images">[];
};

export async function getPropertyForEdit(id: string): Promise<PropertyForEdit | null> {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*, images:property_images(*)")
    .eq("id", id)
    .order("position", { referencedTable: "property_images", ascending: true })
    .maybeSingle()
    .overrideTypes<PropertyForEdit, { merge: false }>();
  if (error) throw new Error(`Erro ao carregar o imóvel: ${error.message}`);
  return data;
}

/** Bairros já usados, para sugerir no formulário e manter os nomes iguais */
export async function getKnownNeighborhoods(): Promise<string[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("properties").select("neighborhood").limit(1000);
  return [...new Set((data ?? []).map((r) => r.neighborhood))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export async function getSettingsForAdmin(): Promise<Tables<"settings">> {
  await requireOwner();
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
  if (error) throw new Error(`Erro ao carregar as configurações: ${error.message}`);
  return data;
}


export type TeamMember = Tables<"admins"> & {
  status: "ativo" | "convite-pendente" | null;
  last_sign_in_at: string | null;
};

/** Equipe do painel (só o dono). O status vem do login de cada pessoa. */
export async function getTeam(): Promise<{ members: TeamMember[]; canManage: boolean }> {
  await requireOwner();
  const supabase = await createClient();
  const { data, error } = await supabase.from("admins").select("*").order("created_at", { ascending: true });
  if (error) throw new Error(`Erro ao carregar a equipe: ${error.message}`);

  const canManage = hasSecretKey();
  const admin = canManage ? createAdminClient() : null;
  const members = await Promise.all(
    (data ?? []).map(async (m): Promise<TeamMember> => {
      if (!admin) return { ...m, status: null, last_sign_in_at: null };
      const { data: auth } = await admin.auth.admin.getUserById(m.user_id);
      const user = auth?.user;
      return {
        ...m,
        status: user ? (user.last_sign_in_at || user.email_confirmed_at ? "ativo" : "convite-pendente") : null,
        last_sign_in_at: user?.last_sign_in_at ?? null,
      };
    }),
  );
  return { members, canManage };
}
