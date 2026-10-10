import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export class MissingSecretKeyError extends Error {
  constructor() {
    super(
      "Para gerenciar a equipe, cadastre a variável SUPABASE_SECRET_KEY no servidor (na Vercel: Settings → Environment Variables). Veja o README.",
    );
  }
}

/**
 * Cliente com a chave secreta: ignora as regras de acesso (RLS).
 * Use SÓ em Server Actions, sempre depois de requireOwner()/requireAdmin(),
 * e nunca envie nada dele para o navegador.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new MissingSecretKeyError();
  return createClient<Database>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasSecretKey() {
  return Boolean(process.env.SUPABASE_SECRET_KEY);
}
