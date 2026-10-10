import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "./env";

/**
 * Cliente anônimo, sem cookies, para as páginas públicas. Por não depender
 * da requisição, pode ser usado dentro de funções com "use cache".
 */
export function createPublicClient() {
  const { url, key } = supabaseEnv();
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
