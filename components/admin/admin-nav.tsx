"use client";

import { Building, LayoutDashboard, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Role = "dono" | "corretor";

const LINKS = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true, owner: false },
  { href: "/admin/imoveis", label: "Imóveis", icon: Building, owner: false },
  { href: "/admin/equipe", label: "Equipe", icon: Users, owner: true },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, owner: true },
];

/** Menu com a aba atual destacada (lê a URL, por isso fica dentro de Suspense) */
export function AdminNav({ role }: { role: Role }) {
  return <AdminNavLinks pathname={usePathname()} role={role} />;
}

/** Mesmo menu sem destaque, usado enquanto a URL e o papel não estão disponíveis */
export function AdminNavLinks({ pathname, role }: { pathname: string | null; role: Role | null }) {
  return (
    <nav aria-label="Painel" className="-mb-px flex gap-1 overflow-x-auto">
      {LINKS.filter((l) => !l.owner || role === "dono").map(({ href, label, icon: Icon, exact }) => {
        const active = pathname != null && (exact ? pathname === href : pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-2.5 py-3 text-sm font-medium transition sm:px-3 ${
              active ? "border-vermelho-600 text-white" : "border-transparent text-marinho-100 hover:text-white"
            }`}
          >
            <Icon className="hidden size-4 sm:block" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
