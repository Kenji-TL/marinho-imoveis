"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";

const noSubscribe = () => () => {};

/** Lê os tokens do "#" da URL (modelo de e-mail padrão do Supabase) e abre a sessão */
export function HashSession() {
  const params = useSearchParams();
  // null no servidor; o "#" da URL só existe no navegador
  const hash = useSyncExternalStore(noSubscribe, () => window.location.hash, () => null);
  const [sessionFailed, setSessionFailed] = useState(false);

  const tokens = hash === null ? null : new URLSearchParams(hash.slice(1));
  const access_token = tokens?.get("access_token");
  const refresh_token = tokens?.get("refresh_token");
  const missing = tokens !== null && (!access_token || !refresh_token);

  useEffect(() => {
    if (!access_token || !refresh_token) return;
    const next = params.get("next");
    const target = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
    createClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => (error ? setSessionFailed(true) : window.location.replace(target)));
  }, [access_token, refresh_token, params]);

  if (!missing && !sessionFailed) return <p className="text-grafite-600">Validando o link…</p>;
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
