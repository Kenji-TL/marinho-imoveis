import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["invite", "recovery", "magiclink", "signup", "email", "email_change"];

function safeNext(value: string | null) {
  return value && value.startsWith("/admin") && !value.startsWith("//") ? value : "/admin";
}

/**
 * Destino dos links enviados por e-mail (convite e recuperação de senha).
 * - Modelo recomendado (README): ?token_hash=...&type=...  → valida aqui
 * - Fluxo PKCE: ?code=...                                    → troca aqui
 * - Modelo padrão do Supabase: tokens no "#" da URL, que o servidor não vê.
 *   Nesse caso segue para /auth/sessao, que lê o "#" no navegador
 *   (o navegador mantém o "#" ao seguir o redirecionamento).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"));
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");
  const failed = new URL("/admin/login?erro=link-invalido", request.url);

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    return NextResponse.redirect(error ? failed : new URL(next, request.url));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(error ? failed : new URL(next, request.url));
  }

  const fallback = new URL("/auth/sessao", request.url);
  fallback.searchParams.set("next", next);
  return NextResponse.redirect(fallback);
}
