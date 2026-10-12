"use client";

import { CircleAlert, CircleCheck, Loader2, UserRound } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { getPublishStatus, type PublishStatus } from "@/lib/admin/api";
import { ROLE_LABEL } from "@/lib/admin/roles";
import { createClient } from "@/lib/supabase/client";
import { AdminNav, AdminNavLinks } from "./admin-nav";
import { AdminSessionProvider, RequireSession, useAdminSession } from "./session";

export function PainelShell({ children }: { children: ReactNode }) {
  return (
    <AdminSessionProvider>
      <div className="flex min-h-full flex-1 flex-col bg-areia-100">
        <PainelHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
          <RequireSession>{children}</RequireSession>
        </main>
      </div>
    </AdminSessionProvider>
  );
}

const PUBLISH_VIEW = {
  running: { icon: <Loader2 className="size-4 animate-spin" aria-hidden />, text: "Atualizando o site…" },
  failed: { icon: <CircleAlert className="size-4 text-dourado-300" aria-hidden />, text: "O site não atualizou" },
  idle: { icon: <CircleCheck className="size-4" aria-hidden />, text: "Site atualizado" },
};

function PainelHeader() {
  const { user } = useAdminSession();
  const publish = usePublishStatus(Boolean(user));
  const view = publish?.configured ? PUBLISH_VIEW[publish.state] : null;

  return (
    <header className="bg-marinho-950 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-serif text-lg sm:text-xl">Marinho Imóveis</span>
            <span className="hidden text-xs tracking-[0.2em] text-marinho-100 uppercase sm:inline">Painel</span>
          </Link>
          {user && (
            <div className="flex items-center gap-3 text-sm sm:gap-4">
              {view && (
                <span className="hidden items-center gap-1.5 text-marinho-100 md:inline-flex" role="status">
                  {view.icon}
                  {view.text}
                </span>
              )}
              <Link href="/" target="_blank" className="hidden text-marinho-100 hover:text-white md:inline">
                Ver site
              </Link>
              <Link
                href="/admin/conta"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-marinho-100 hover:bg-white/10 hover:text-white"
                title="Minha conta"
              >
                <UserRound className="size-4" aria-hidden />
                <span className="hidden max-w-40 truncate sm:inline">{user.name || user.email}</span>
                <span className="sr-only sm:hidden">Minha conta</span>
                <span className="hidden rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase lg:inline">
                  {ROLE_LABEL[user.role]}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => createClient().auth.signOut()}
                className="rounded-lg border border-white/30 px-3 py-1.5 font-medium hover:bg-white/10"
              >
                Sair
              </button>
            </div>
          )}
        </div>
        {/* O menu lê a URL (aba atual), por isso fica dentro de Suspense */}
        <Suspense fallback={<AdminNavLinks pathname={null} role={user?.role ?? null} />}>
          <AdminNav role={user?.role ?? null} />
        </Suspense>
      </div>
      {/* No celular, só aparece enquanto atualiza ou se der erro */}
      {view && publish?.state !== "idle" && (
        <p className="flex items-center justify-center gap-1.5 border-t border-white/10 py-1.5 text-xs text-marinho-100 md:hidden" role="status">
          {view.icon}
          {view.text}
          {publish?.state === "failed" && " · salve de novo"}
        </p>
      )}
    </header>
  );
}

/**
 * Situação da última publicação do site. Depois de salvar, acompanha até o
 * site terminar de atualizar.
 */
function usePublishStatus(enabled: boolean) {
  const [status, setStatus] = useState<PublishStatus | null>(null);
  const [watching, setWatching] = useState(0);

  useEffect(() => {
    const start = () => setWatching((n) => n + 1);
    window.addEventListener("site:publicando", start);
    return () => window.removeEventListener("site:publicando", start);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async (attempt: number) => {
      const next = await getPublishStatus().catch(() => null);
      if (!alive) return;
      setStatus(next);
      // A GitHub leva alguns segundos para registrar o pedido; segue olhando enquanto roda
      if (next?.configured && (next.state === "running" || (watching > 0 && attempt < 3))) {
        timer = setTimeout(() => check(attempt + 1), 10_000);
      }
    };
    check(0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [enabled, watching]);

  return status;
}
