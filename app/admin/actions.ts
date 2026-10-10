"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, safeAdminPath } from "@/lib/auth";
import { absoluteUrl } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage, firstErrors, newPasswordSchema } from "@/lib/validation/team";

export type LoginState = { error: string; email: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Informe o e-mail e a senha.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.code === "invalid_credentials"
        ? "E-mail ou senha incorretos."
        : error.code === "over_request_rate_limit"
          ? "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo."
          : "Não foi possível entrar agora. Tente novamente.";
    return { error: message, email };
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "Esta conta não tem acesso ao painel.", email };
  }

  redirect(safeAdminPath(formData.get("next")));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export type ResetState = { ok: boolean; message: string; email: string } | undefined;

/** "Esqueci minha senha": envia o link por e-mail sem revelar se a conta existe */
export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!z.email().safeParse(email).success) return { ok: false, message: "Informe um e-mail válido.", email };

  const { error } = await createPublicClient().auth.resetPasswordForEmail(email, {
    redirectTo: absoluteUrl("/auth/confirm?next=/admin/definir-senha"),
  });
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return { ok: false, message: "Muitos pedidos seguidos. Aguarde alguns minutos e tente de novo.", email };
  }
  return {
    ok: true,
    message: `Se ${email} tiver acesso ao painel, chega em instantes um e-mail com o link para criar uma senha nova. Confira também o spam.`,
    email,
  };
}

export type NewPasswordState = { message: string; errors: Partial<Record<string, string>> } | undefined;

/** Página aberta pelo link do e-mail (convite ou recuperação): define a senha */
export async function setNewPassword(_prev: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  await requireAdmin();
  const parsed = newPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) return { message: "Confira os campos destacados.", errors: firstErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { message: authErrorMessage(error), errors: {} };
  redirect("/admin?aviso=senha-definida");
}
