"use server";

import { redirect } from "next/navigation";
import { requireOwner, type TeamRole } from "@/lib/auth";
import { createAdminClient, MissingSecretKeyError } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site";
import { authErrorMessage, firstErrors, memberSchema } from "@/lib/validation/team";

export type TeamResult =
  | { ok: true; message: string }
  | { ok: false; message: string; errors?: Partial<Record<string, string>> };

const ACCESS_LINK_REDIRECT = () => absoluteUrl("/auth/confirm?next=/admin/definir-senha");

type AdminClient = ReturnType<typeof createAdminClient>;

function adminOrError(): AdminClient | TeamResult {
  try {
    return createAdminClient();
  } catch (e) {
    if (e instanceof MissingSecretKeyError) return { ok: false, message: e.message };
    throw e;
  }
}

async function findUserIdByEmail(admin: AdminClient, email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (user) return user.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

function friendlyDbError(message: string) {
  return /pelo menos um dono/i.test(message) ? "O painel precisa ter pelo menos um dono." : `Não foi possível concluir: ${message}`;
}

/** Adiciona uma pessoa à equipe, por convite no e-mail ou com senha provisória */
export async function addMember(input: unknown): Promise<TeamResult> {
  await requireOwner();
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Confira os campos destacados.", errors: firstErrors(parsed.error) };
  const { name, email, role, mode, password } = parsed.data;

  const supabase = await createClient();
  const { data: already } = await supabase.from("admins").select("user_id").eq("email", email).maybeSingle();
  if (already) return { ok: false, message: "Essa pessoa já está na equipe.", errors: { email: "Já está na equipe." } };

  const admin = adminOrError();
  if (!("auth" in admin)) return admin;

  let userId: string | null = null;
  let createdNow = false;

  if (mode === "senha") {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (data?.user) {
      userId = data.user.id;
      createdNow = true;
    } else if (error?.code === "email_exists") {
      // Conta já existia no login (ex.: pessoa removida antes): reaproveita e troca a senha
      userId = await findUserIdByEmail(admin, email);
      if (userId) {
        const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password, user_metadata: { name } });
        if (updateError) return { ok: false, message: authErrorMessage(updateError) };
      }
    } else if (error) {
      return { ok: false, message: authErrorMessage(error), errors: error.code === "weak_password" ? { password: authErrorMessage(error) } : undefined };
    }
  } else {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { name },
      redirectTo: ACCESS_LINK_REDIRECT(),
    });
    if (data?.user) {
      userId = data.user.id;
      createdNow = true;
    } else if (error?.code === "email_exists") {
      userId = await findUserIdByEmail(admin, email);
      if (userId) {
        const { error: linkError } = await createPublicClient().auth.resetPasswordForEmail(email, { redirectTo: ACCESS_LINK_REDIRECT() });
        if (linkError) return { ok: false, message: authErrorMessage(linkError) };
      }
    } else if (error) {
      return { ok: false, message: authErrorMessage(error) };
    }
  }

  if (!userId) return { ok: false, message: "Não foi possível criar o acesso dessa pessoa. Tente de novo." };

  const { error: insertError } = await admin.from("admins").upsert({ user_id: userId, name, email, role });
  if (insertError) {
    if (createdNow) await admin.auth.admin.deleteUser(userId);
    return { ok: false, message: friendlyDbError(insertError.message) };
  }

  return {
    ok: true,
    message:
      mode === "senha"
        ? `${name} já pode entrar com o e-mail ${email} e a senha que você definiu. Peça para trocar a senha em "Minha conta" no primeiro acesso.`
        : `Convite enviado para ${email}. A pessoa recebe um link para criar a senha.`,
  };
}

export async function changeMemberRole(userId: string, role: TeamRole): Promise<TeamResult> {
  const me = await requireOwner();
  if (role !== "dono" && role !== "corretor") return { ok: false, message: "Acesso inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("admins").update({ role }).eq("user_id", userId);
  if (error) return { ok: false, message: friendlyDbError(error.message) };
  // Quem tirou o próprio acesso de dono não pode mais ficar nesta tela
  if (userId === me.id && role !== "dono") redirect("/admin?aviso=papel-alterado");
  return { ok: true, message: role === "dono" ? "Agora essa pessoa é dona." : "Agora essa pessoa é corretora." };
}

export async function removeMember(userId: string): Promise<TeamResult> {
  const me = await requireOwner();
  if (userId === me.id) {
    return { ok: false, message: "Você não pode remover a si mesmo. Peça a outro dono para fazer isso." };
  }
  const supabase = await createClient();
  const { data: removed, error } = await supabase.from("admins").delete().eq("user_id", userId).select("email").maybeSingle();
  if (error) return { ok: false, message: friendlyDbError(error.message) };
  if (!removed) return { ok: false, message: "Essa pessoa não está mais na equipe." };

  // Apaga também o login, para a pessoa não conseguir mais entrar
  const admin = adminOrError();
  if ("auth" in admin) await admin.auth.admin.deleteUser(userId);
  return { ok: true, message: `${removed.email ?? "A pessoa"} foi removida da equipe.` };
}

/** Envia por e-mail um link para a pessoa (re)definir a senha */
export async function sendAccessLink(userId: string): Promise<TeamResult> {
  await requireOwner();
  const supabase = await createClient();
  const { data: member } = await supabase.from("admins").select("email").eq("user_id", userId).maybeSingle();
  if (!member?.email) return { ok: false, message: "Não encontramos o e-mail dessa pessoa." };
  const { error } = await createPublicClient().auth.resetPasswordForEmail(member.email, { redirectTo: ACCESS_LINK_REDIRECT() });
  if (error) return { ok: false, message: authErrorMessage(error) };
  return { ok: true, message: `Enviamos para ${member.email} um link para criar uma senha nova.` };
}
