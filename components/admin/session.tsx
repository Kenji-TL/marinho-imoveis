"use client";

import type { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AdminUser } from "@/lib/admin/roles";
import { createClient } from "@/lib/supabase/client";
import { Notice } from "./ui";

type SessionState = { user: AdminUser | null; failed: boolean; refresh: () => Promise<void> };

const SessionContext = createContext<SessionState | null>(null);

/** Sessão do painel; user é null enquanto carrega */
export function useAdminSession(): SessionState {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useAdminSession fora do AdminSessionProvider");
  return session;
}

/** Quem está usando o painel (use só dentro de RequireSession) */
export function useAdmin() {
  const { user, refresh } = useAdminSession();
  if (!user) throw new Error("useAdmin fora do RequireSession");
  return { user, refresh };
}

/**
 * Garante que quem abre o painel faz parte da equipe (dono ou corretor).
 * Sem login: vai para a tela de entrada. Logado, mas fora da equipe: sai e
 * volta à entrada com aviso. A proteção dos dados em si fica no banco (RLS).
 */
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [failed, setFailed] = useState(false);

  const loadMember = useCallback(
    async (session: Session | null) => {
      const supabase = createClient();
      if (!session) {
        const next = `${window.location.pathname}${window.location.search}`;
        router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
        return;
      }
      const { data: member, error } = await supabase
        .from("admins")
        .select("role, name, email")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) {
        setFailed(true);
        return;
      }
      if (!member) {
        await supabase.auth.signOut();
        router.replace("/admin/login?erro=sem-acesso");
        return;
      }
      setFailed(false);
      setUser({ id: session.user.id, email: member.email ?? session.user.email ?? "", name: member.name, role: member.role });
    },
    [router],
  );

  const refresh = useCallback(async () => {
    const { data } = await createClient().auth.getSession();
    await loadMember(data.session);
  }, [loadMember]);

  useEffect(() => {
    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") router.replace("/admin/login");
      // Fora do callback: o Supabase pede para não chamar o banco dentro dele
      else if (event === "INITIAL_SESSION") setTimeout(() => void loadMember(session), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [loadMember, router]);

  return <SessionContext.Provider value={{ user, failed, refresh }}>{children}</SessionContext.Provider>;
}

/** Mostra o conteúdo só depois de confirmar o acesso */
export function RequireSession({ children }: { children: ReactNode }) {
  const { user, failed, refresh } = useAdminSession();
  if (failed) {
    return (
      <Notice tone="error">
        Não foi possível abrir o painel. Confira a internet e{" "}
        <button type="button" className="font-semibold underline" onClick={() => refresh()}>
          tente de novo
        </button>
        .
      </Notice>
    );
  }
  if (!user) {
    return (
      <div className="flex justify-center py-20" aria-live="polite">
        <Loader2 className="size-7 animate-spin text-marinho-700" aria-label="Carregando o painel" />
      </div>
    );
  }
  return children;
}

/** Áreas só do dono (configurações e equipe): quem é corretor volta para o início */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const { user } = useAdmin();
  const router = useRouter();
  const isOwner = user.role === "dono";
  useEffect(() => {
    if (!isOwner) router.replace("/admin?aviso=so-dono");
  }, [isOwner, router]);
  return isOwner ? children : null;
}
