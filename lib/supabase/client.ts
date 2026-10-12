import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

let client: SupabaseClient<Database> | null = null;

/**
 * Cliente do navegador, usado pelo painel. A sessão fica guardada no
 * navegador e o banco só deixa a equipe ler e alterar os dados (RLS).
 */
export function createClient() {
  client ??= createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    // Os links de e-mail são tratados em /auth/confirm
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } },
  );
  return client;
}
