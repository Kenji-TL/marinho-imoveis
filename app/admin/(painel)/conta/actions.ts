"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage, changePasswordSchema, firstErrors } from "@/lib/validation/team";

export type AccountState =
  | { ok: true; message: string; at: number }
  | { ok: false; message: string; errors?: Partial<Record<string, string>> }
  | undefined;

const nameSchema = z.string().trim().min(2, "Informe seu nome.").max(80, "Use no máximo 80 caracteres.");

export async function updateMyName(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const me = await requireAdmin();
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message, errors: { name: parsed.error.issues[0].message } };

  const supabase = await createClient();
  const { error } = await supabase.from("admins").update({ name: parsed.data }).eq("user_id", me.id);
  if (error) return { ok: false, message: `Não foi possível salvar: ${error.message}` };
  return { ok: true, message: "Nome atualizado.", at: Date.now() };
}

export async function changeMyPassword(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const me = await requireAdmin();
  const parsed = changePasswordSchema.safeParse({
    current: String(formData.get("current") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Confira os campos destacados.", errors: firstErrors(parsed.error) };

  // Confere a senha atual sem mexer na sessão aberta
  const checker = createPublicClient();
  const { error: wrong } = await checker.auth.signInWithPassword({ email: me.email, password: parsed.data.current });
  if (wrong) return { ok: false, message: "A senha atual está incorreta.", errors: { current: "Senha atual incorreta." } };
  await checker.auth.signOut({ scope: "local" });

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: authErrorMessage(error) };
  return { ok: true, message: "Senha alterada. Use a nova senha no próximo acesso.", at: Date.now() };
}
