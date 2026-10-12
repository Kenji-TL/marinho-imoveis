"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";

const OTP_TYPES: EmailOtpType[] = ["invite", "recovery", "magiclink", "signup", "email", "email_change"];
const noSubscribe = () => () => {};

/**
 * Abre a sessão a partir do link do e-mail e segue para o painel.
 * - Modelo recomendado (README): ?token_hash=...&type=...
 * - Fluxo PKCE: ?code=...
 * - Modelo padrão do Supabase: tokens no "#" da URL
 */
export function ConfirmLink() {
  const params = useSearchParams();
  // null no servidor; o "#" da URL só existe no navegador
  const hash = useSyncExternalStore(noSubscribe, () => window.location.hash, () => null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (hash === null) return;
    const nextParam = params.get("next");
    const next = nextParam && nextParam.startsWith("/admin") && !nextParam.startsWith("//") ? nextParam : "/admin";
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;
    const code = params.get("code");
    const fromHash = new URLSearchParams(hash.slice(1));
    const access_token = fromHash.get("access_token");
    const refresh_token = fromHash.get("refresh_token");

    const auth = createClient().auth;
    const attempt =
      tokenHash && type && OTP_TYPES.includes(type)
        ? auth.verifyOtp({ type, token_hash: tokenHash })
        : code
          ? auth.exchangeCodeForSession(code)
          : access_token && refresh_token
            ? auth.setSession({ access_token, refresh_token })
            : Promise.resolve({ error: new Error("Link sem dados de acesso") });

    attempt.then(({ error }) => (error ? setFailed(true) : window.location.replace(next)));
  }, [hash, params]);

  if (!failed) return <p className="text-grafite-600">Validando o link…</p>;
  return (
    <div className="max-w-sm space-y-4">
      <h1 className="font-serif text-2xl text-marinho-950">Link inválido ou expirado</h1>
      <p className="text-grafite-600">Os links de acesso valem por pouco tempo e só podem ser usados uma vez.</p>
      <Link href="/admin/recuperar-senha" className="inline-block rounded-lg bg-marinho-700 px-5 py-3 text-sm font-semibold text-white">
        Pedir um link novo
      </Link>
    </div>
  );
}
