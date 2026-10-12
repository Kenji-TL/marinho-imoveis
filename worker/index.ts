// Serviço do site na Cloudflare (plano grátis).
//   - Entrega as páginas prontas (pasta out/, gerada pelo `npm run build`),
//     com as fotos dos imóveis anunciados em out/fotos
//   - /api/*    o que o painel não pode fazer só com o banco: criar e remover
//               acessos da equipe e publicar o site de novo
//   - Todo dia: mantém o banco acordado, apaga fotos de imóveis vendidos ou
//               alugados há 30 dias e fotos soltas, e faz o backup semanal

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";
import { authErrorMessage, firstErrors, memberSchema } from "../lib/validation/team";

export interface Env {
  ASSETS: Fetcher;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  /** Chave secreta do Supabase: equipe e manutenção diária */
  SUPABASE_SECRET_KEY?: string;
  /** Endereço do site, usado nos links dos convites por e-mail */
  SITE_URL?: string;
  /** Publicação automática: token da GitHub e repositório "dono/nome" */
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  /** Só para testes: outro endereço no lugar da API da GitHub */
  GITHUB_API_URL?: string;
  /** Só no desenvolvimento: endereço do `next dev` que pode chamar /api */
  DEV_ORIGIN?: string;
}

type Db = SupabaseClient<Database>;
type Member = { user_id: string; role: "dono" | "corretor"; email: string | null };

const WORKFLOW = "publicar.yml";
const CLOSED_PHOTOS_DAYS = 30;
const ORPHAN_PHOTOS_DAYS = 2;
const BACKUPS_TO_KEEP = 12;
const PHOTOS_BUCKET = "property-images";
const BACKUPS_BUCKET = "backups";

// <imóvel>/<foto>.jpg e a versão pequena <imóvel>/<foto>-p.jpg
const smallPath = (path: string) => path.replace(/\.jpg$/, "-p.jpg");
const bothVersions = (paths: string[]) => paths.flatMap((p) => [p, smallPath(p)]);

const json = (data: unknown, status = 200) => Response.json(data, { status });
const fail = (status: number, message: string) => json({ message }, status);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    let response: Response;
    try {
      response = await handleApi(request, env, url.pathname.slice("/api/".length));
    } catch (e) {
      console.error(e);
      response = fail(500, "Erro inesperado no servidor do painel. Tente de novo.");
    }
    for (const [key, value] of Object.entries(cors)) response.headers.set(key, value);
    return response;
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(dailyMaintenance(env, controller.scheduledTime));
  },
} satisfies ExportedHandler<Env>;

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!env.DEV_ORIGIN || origin !== env.DEV_ORIGIN) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
  };
}

// ---------------------------------------------------------------- Clientes do banco

/** Cliente com o login de quem chamou: o banco aplica as regras de acesso (RLS) */
function userClient(env: Env, token: string): Db {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/** Cliente com a chave secreta (ignora o RLS): só depois de conferir quem chamou */
function adminClient(env: Env): Db | null {
  if (!env.SUPABASE_SECRET_KEY) return null;
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Quem chamou faz parte da equipe? */
async function authenticate(request: Request, env: Env): Promise<Member | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const db = userClient(env, token);
  const { data: auth, error } = await db.auth.getUser(token);
  if (error || !auth.user) return null;
  // Cada pessoa enxerga a própria linha da equipe (RLS)
  const { data: member } = await db.from("admins").select("user_id, role, email").eq("user_id", auth.user.id).maybeSingle();
  return member;
}

// ---------------------------------------------------------------- /api

async function handleApi(request: Request, env: Env, route: string): Promise<Response> {
  const member = await authenticate(request, env);
  if (!member) return fail(401, "Sua sessão expirou. Entre de novo no painel.");
  const method = request.method;

  if (route === "publicar" && method === "GET") return json(await publishStatus(env));
  if (route === "publicar" && method === "POST") return publish(env);

  if (route.startsWith("equipe")) {
    if (member.role !== "dono") return fail(403, "Essa área é só para quem tem acesso de dono.");
    const admin = adminClient(env);
    if (!admin) return fail(503, "Falta configurar a chave secreta do Supabase (SUPABASE_SECRET_KEY) no serviço do painel.");
    if (route === "equipe" && method === "GET") return listTeam(admin);
    if (route === "equipe/adicionar" && method === "POST") return addMember(request, env, admin);
    if (route === "equipe/remover" && method === "POST") return removeMember(request, admin, member);
  }
  return fail(404, "Rota não encontrada.");
}

// ---------------------------------------------------------------- Publicação (GitHub Actions)

const github = (env: Env, path: string, init: RequestInit = {}) =>
  fetch(`${env.GITHUB_API_URL || "https://api.github.com"}/repos/${env.GITHUB_REPO}${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "user-agent": "marinho-imoveis-painel",
      "x-github-api-version": "2022-11-28",
      ...init.headers,
    },
  });

async function publish(env: Env) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return json({ configured: false });
  const res = await github(env, `/actions/workflows/${WORKFLOW}/dispatches`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ref: env.GITHUB_BRANCH || "main" }),
  });
  if (!res.ok) {
    console.error("GitHub dispatch", res.status, await res.text());
    return fail(502, "Não foi possível pedir a atualização do site.");
  }
  return json({ configured: true });
}

async function publishStatus(env: Env) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return { configured: false, state: "idle", updated_at: null };
  const res = await github(env, `/actions/workflows/${WORKFLOW}/runs?per_page=1`);
  if (!res.ok) return { configured: true, state: "failed", updated_at: null };
  const { workflow_runs: runs } = (await res.json()) as {
    workflow_runs: { status: string; conclusion: string | null; updated_at: string }[];
  };
  const run = runs[0];
  if (!run) return { configured: true, state: "idle", updated_at: null };
  const state = run.status !== "completed" ? "running" : run.conclusion === "failure" ? "failed" : "idle";
  return { configured: true, state, updated_at: run.updated_at };
}

// ---------------------------------------------------------------- Equipe (só dono)

function friendlyDbError(message: string) {
  return /pelo menos um dono/i.test(message) ? "O painel precisa ter pelo menos um dono." : `Não foi possível concluir: ${message}`;
}

async function findUserIdByEmail(admin: Db, email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (user) return user.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function listTeam(admin: Db) {
  const { data, error } = await admin.from("admins").select("*").order("created_at", { ascending: true });
  if (error) return fail(502, `Erro ao carregar a equipe: ${error.message}`);
  const members = await Promise.all(
    (data ?? []).map(async (m) => {
      const { data: auth } = await admin.auth.admin.getUserById(m.user_id);
      const user = auth?.user;
      return {
        ...m,
        status: user ? (user.last_sign_in_at || user.email_confirmed_at ? "ativo" : "convite-pendente") : null,
        last_sign_in_at: user?.last_sign_in_at ?? null,
      };
    }),
  );
  return json({ members });
}

/** Adiciona uma pessoa à equipe, por convite no e-mail ou com senha provisória */
async function addMember(request: Request, env: Env, admin: Db) {
  const parsed = memberSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, message: "Confira os campos destacados.", errors: firstErrors(parsed.error) });
  const { name, email, role, mode, password } = parsed.data;
  const redirectTo = `${(env.SITE_URL || new URL(request.url).origin).replace(/\/$/, "")}/auth/confirm?next=/admin/definir-senha`;

  const { data: already } = await admin.from("admins").select("user_id").eq("email", email).maybeSingle();
  if (already) return json({ ok: false, message: "Essa pessoa já está na equipe.", errors: { email: "Já está na equipe." } });

  let userId: string | null = null;
  let createdNow = false;

  if (mode === "senha") {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
    if (data?.user) {
      userId = data.user.id;
      createdNow = true;
    } else if (error?.code === "email_exists") {
      // Conta já existia no login (ex.: pessoa removida antes): reaproveita e troca a senha
      userId = await findUserIdByEmail(admin, email);
      if (userId) {
        const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password, user_metadata: { name } });
        if (updateError) return json({ ok: false, message: authErrorMessage(updateError) });
      }
    } else if (error) {
      const message = authErrorMessage(error);
      return json({ ok: false, message, errors: error.code === "weak_password" ? { password: message } : undefined });
    }
  } else {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { name }, redirectTo });
    if (data?.user) {
      userId = data.user.id;
      createdNow = true;
    } else if (error?.code === "email_exists") {
      userId = await findUserIdByEmail(admin, email);
      if (userId) {
        const { error: linkError } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
        if (linkError) return json({ ok: false, message: authErrorMessage(linkError) });
      }
    } else if (error) {
      return json({ ok: false, message: authErrorMessage(error) });
    }
  }

  if (!userId) return json({ ok: false, message: "Não foi possível criar o acesso dessa pessoa. Tente de novo." });

  const { error: insertError } = await admin.from("admins").upsert({ user_id: userId, name, email, role });
  if (insertError) {
    if (createdNow) await admin.auth.admin.deleteUser(userId);
    return json({ ok: false, message: friendlyDbError(insertError.message) });
  }

  return json({
    ok: true,
    message:
      mode === "senha"
        ? `${name} já pode entrar com o e-mail ${email} e a senha que você definiu. Peça para trocar a senha em "Minha conta" no primeiro acesso.`
        : `Convite enviado para ${email}. A pessoa recebe um link para criar a senha.`,
  });
}

async function removeMember(request: Request, admin: Db, me: Member) {
  const body = (await request.json().catch(() => null)) as { userId?: unknown } | null;
  const userId = typeof body?.userId === "string" ? body.userId : "";
  if (!userId) return json({ ok: false, message: "Pessoa inválida." });
  if (userId === me.user_id) {
    return json({ ok: false, message: "Você não pode remover a si mesmo. Peça a outro dono para fazer isso." });
  }
  const { data: removed, error } = await admin.from("admins").delete().eq("user_id", userId).select("email").maybeSingle();
  if (error) return json({ ok: false, message: friendlyDbError(error.message) });
  if (!removed) return json({ ok: false, message: "Essa pessoa não está mais na equipe." });
  // Apaga também o login, para a pessoa não conseguir mais entrar
  await admin.auth.admin.deleteUser(userId);
  return json({ ok: true, message: `${removed.email ?? "A pessoa"} foi removida da equipe.` });
}

// ---------------------------------------------------------------- Manutenção diária

export async function dailyMaintenance(env: Env, scheduledTime: number) {
  const admin = adminClient(env);
  if (!admin) {
    console.error("Manutenção diária parada: falta SUPABASE_SECRET_KEY");
    return;
  }
  const steps: [string, () => Promise<unknown>][] = [
    // Também mantém o banco ativo (o plano grátis do Supabase pausa após 7 dias parado)
    ["fotos de vendidos e alugados", () => purgeClosedPhotos(admin)],
    ["fotos soltas", () => sweepOrphanPhotos(admin)],
    // Domingo: cópia do banco no bucket privado de backups
    ["backup", async () => (new Date(scheduledTime).getUTCDay() === 0 ? backupDatabase(admin, scheduledTime) : null)],
    // Usa o token da GitHub (tokens parados por 1 ano são revogados)
    ["token da GitHub", () => publishStatus(env)],
  ];
  for (const [name, run] of steps) {
    try {
      console.log(name, await run());
    } catch (e) {
      console.error(`Manutenção (${name}):`, e);
    }
  }
}

async function removePhotos(admin: Db, keys: string[]) {
  for (let i = 0; i < keys.length; i += 1000) {
    const { error } = await admin.storage.from(PHOTOS_BUCKET).remove(keys.slice(i, i + 1000));
    if (error) throw new Error(error.message);
  }
}

async function purgeClosedPhotos(admin: Db) {
  const { data, error } = await admin.rpc("purge_closed_property_photos", { p_days: CLOSED_PHOTOS_DAYS });
  if (error) throw new Error(error.message);
  const paths = data ?? [];
  await removePhotos(admin, bothVersions(paths));
  return { apagadas: paths.length };
}

/** Arquivos que nenhum imóvel usa (ex.: enviados e o imóvel não foi salvo) */
async function sweepOrphanPhotos(admin: Db) {
  const { data, error } = await admin.rpc("orphan_property_photos", { p_days: ORPHAN_PHOTOS_DAYS });
  if (error) throw new Error(error.message);
  await removePhotos(admin, data ?? []);
  return { apagadas: (data ?? []).length };
}

async function backupDatabase(admin: Db, now: number) {
  const tables = ["settings", "properties", "property_images", "admins"] as const;
  const dump: Record<string, unknown[]> = {};
  for (const table of tables) {
    const rows: unknown[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await admin.from(table).select("*").range(from, from + 999);
      if (error) throw new Error(`${table}: ${error.message}`);
      rows.push(...data);
      if (data.length < 1000) break;
    }
    dump[table] = rows;
  }
  const bucket = admin.storage.from(BACKUPS_BUCKET);
  const name = `${new Date(now).toISOString().slice(0, 10)}.json`;
  const body = JSON.stringify({ criado_em: new Date(now).toISOString(), ...dump });
  const { error } = await bucket.upload(`banco/${name}`, body, { contentType: "application/json", upsert: true });
  if (error) throw new Error(error.message);

  // Guarda só as últimas cópias
  const { data: files } = await bucket.list("banco", { limit: 1000 });
  const old = (files ?? []).map((f) => f.name).sort().slice(0, -BACKUPS_TO_KEEP);
  if (old.length) await bucket.remove(old.map((n) => `banco/${n}`));
  return { arquivo: `banco/${name}`, apagados: old.length };
}
