import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "./env";

/**
 * Cliente com a sessão do usuário (cookies). Usado no painel admin,
 * em Server Components e Server Actions. As permissões vêm do RLS.
 */
export async function createClient() {
  const { url, key } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado a partir de um Server Component: não dá para gravar cookie
          // aqui, e tudo bem, porque o proxy já renova a sessão a cada request.
        }
      },
    },
  });
}
