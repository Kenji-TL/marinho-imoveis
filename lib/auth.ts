import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { Enums } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type TeamRole = Enums<"team_role">;
export type AdminUser = { id: string; email: string; name: string | null; role: TeamRole };

export const ROLE_LABEL: Record<TeamRole, string> = { dono: "Dono", corretor: "Corretor" };

/**
 * Garante que quem está acessando faz parte da equipe do painel (dono ou
 * corretor). Toda página e toda ação do painel passa por aqui antes de ler
 * ou gravar dados.
 */
export const requireAdmin = cache(async (): Promise<AdminUser> => {
  // A checagem de login é sempre feita na hora da visita (a biblioteca do
  // Supabase lê o relógio para validar a sessão)
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/admin/login");
  }

  // Cada pessoa enxerga a própria linha da equipe (RLS)
  const { data: member } = await supabase
    .from("admins")
    .select("role, name, email")
    .eq("user_id", claims.sub)
    .maybeSingle();
  if (!member) {
    // Logado, mas fora da equipe: encerra a sessão e volta ao login com aviso
    redirect("/admin/sair?motivo=sem-acesso");
  }

  return {
    id: claims.sub,
    email: member.email ?? (typeof claims.email === "string" ? claims.email : ""),
    name: member.name,
    role: member.role,
  };
});

/** Só o dono passa: configurações do site e equipe. */
export async function requireOwner(): Promise<AdminUser> {
  const user = await requireAdmin();
  if (user.role !== "dono") redirect("/admin?aviso=so-dono");
  return user;
}

/** Aceita só caminhos internos do painel como destino pós-login. */
export function safeAdminPath(value: unknown): string {
  if (typeof value !== "string") return "/admin";
  if (
    !value.startsWith("/admin") ||
    value.startsWith("/admin/login") ||
    value.startsWith("/admin/sair") ||
    value.startsWith("/admin/recuperar-senha")
  ) {
    return "/admin";
  }
  return value;
}
