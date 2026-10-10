import { UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav, AdminNavLinks } from "@/components/admin/admin-nav";
import { requireAdmin, ROLE_LABEL } from "@/lib/auth";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel Marinho Imóveis" },
  robots: { index: false, follow: false },
};

export default function PainelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-areia-100">
      <header className="bg-marinho-950 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-14 items-center justify-between gap-4">
            <Link href="/admin" className="flex items-baseline gap-2">
              <span className="font-serif text-lg sm:text-xl">Marinho Imóveis</span>
              <span className="hidden text-xs tracking-[0.2em] text-marinho-100 uppercase sm:inline">Painel</span>
            </Link>
            <Suspense fallback={null}>
              <UserMenu />
            </Suspense>
          </div>
          <Suspense fallback={<AdminNavLinks pathname={null} role={null} />}>
            <NavForRole />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}

async function NavForRole() {
  const user = await requireAdmin();
  return <AdminNav role={user.role} />;
}

async function UserMenu() {
  const user = await requireAdmin();
  return (
    <div className="flex items-center gap-3 text-sm sm:gap-4">
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
      <form action={logout}>
        <button type="submit" className="rounded-lg border border-white/30 px-3 py-1.5 font-medium hover:bg-white/10">
          Sair
        </button>
      </form>
    </div>
  );
}
