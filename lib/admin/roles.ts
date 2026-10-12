import type { Enums } from "@/lib/database.types";

export type TeamRole = Enums<"team_role">;
export type AdminUser = { id: string; email: string; name: string | null; role: TeamRole };

export const ROLE_LABEL: Record<TeamRole, string> = { dono: "Dono", corretor: "Corretor" };

/** Aceita só caminhos internos do painel como destino pós-login. */
export function safeAdminPath(value: unknown): string {
  if (typeof value !== "string") return "/admin";
  if (
    !value.startsWith("/admin") ||
    value.startsWith("//") ||
    value.startsWith("/admin/login") ||
    value.startsWith("/admin/sair") ||
    value.startsWith("/admin/recuperar-senha")
  ) {
    return "/admin";
  }
  return value;
}
