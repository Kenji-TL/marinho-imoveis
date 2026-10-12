import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "./env";

/**
 * Cliente anônimo, sem sessão. Lê os dados do site público na publicação
 * (build), com a chave publicável.
 */
export function createPublicClient() {
  const { url, key } = supabaseEnv();
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
