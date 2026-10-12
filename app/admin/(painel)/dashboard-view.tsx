"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PropertyListRow } from "@/components/admin/property-list-item";
import { buttonPrimary, Notice } from "@/components/admin/ui";
import { getDashboardStats, getRecentProperties, type DashboardStats } from "@/lib/admin/api";
import { useLoad } from "@/lib/admin/use-load";

const NOTICES: Record<string, { tone: "success" | "info"; text: string }> = {
  "senha-definida": { tone: "success", text: "Senha criada! Da próxima vez, entre com seu e-mail e essa senha." },
  "so-dono": { tone: "info", text: "Essa área é só para quem tem acesso de dono." },
  "papel-alterado": { tone: "info", text: "Seu acesso agora é de corretor. Equipe e configurações ficam com os donos." },
};

export function DashboardView() {
  const aviso = useSearchParams().get("aviso");
  const notice = aviso ? NOTICES[aviso] : undefined;
  const stats = useLoad(getDashboardStats);
  const recent = useLoad(getRecentProperties);
  const reload = () => {
    stats.reload();
    recent.reload();
  };

  return (
    <div className="space-y-8">
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-marinho-950">Visão geral</h1>
        <Link href="/admin/imoveis/novo" className={buttonPrimary}>
          <Plus className="size-4" aria-hidden /> Novo imóvel
        </Link>
      </div>

      {stats.error ? <Notice tone="error">{stats.error}</Notice> : <StatsGrid stats={stats.data} />}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl text-marinho-950">Atualizados recentemente</h2>
          <Link href="/admin/imoveis" className="text-sm font-medium text-marinho-700 hover:underline">
            Ver todos
          </Link>
        </div>
        {recent.error ? (
          <Notice tone="error">{recent.error}</Notice>
        ) : !recent.data ? (
          <div className="h-48 animate-pulse rounded-xl bg-white" aria-hidden />
        ) : recent.data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-areia-300 bg-white px-6 py-10 text-center">
            <p className="font-medium">Nenhum imóvel cadastrado ainda.</p>
            <Link href="/admin/imoveis/novo" className={`${buttonPrimary} mt-4`}>
              <Plus className="size-4" aria-hidden /> Cadastrar o primeiro imóvel
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-areia-200 rounded-xl border border-areia-300 bg-white">
            {recent.data.map((item) => (
              <PropertyListRow key={item.id} item={item} onChanged={reload} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatsGrid({ stats }: { stats?: DashboardStats }) {
  const items = [
    { label: "Imóveis cadastrados", value: stats?.total, href: "/admin/imoveis" },
    { label: "Para aluguel", value: stats?.rent, href: "/admin/imoveis?negocio=rent" },
    { label: "À venda", value: stats?.sale, href: "/admin/imoveis?negocio=sale" },
    { label: "Disponíveis", value: stats?.available, href: "/admin/imoveis?situacao=available" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="relative rounded-xl border border-areia-300 bg-white p-5 transition hover:border-marinho-700">
          <dt className="text-sm text-grafite-600">
            <Link href={item.href} className="after:absolute after:inset-0">
              {item.label}
            </Link>
          </dt>
          <dd className="mt-1 font-serif text-3xl text-marinho-700 lining-nums tabular-nums">
            {item.value ?? <span className="inline-block h-8 w-10 animate-pulse rounded bg-areia-200" />}
          </dd>
        </div>
      ))}
    </dl>
  );
}
