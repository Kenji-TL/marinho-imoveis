import type { Metadata } from "next";
import { Suspense } from "react";
import { TeamManager } from "@/components/admin/team-manager";
import { getTeam } from "@/lib/admin/queries";
import { requireOwner } from "@/lib/auth";

export const metadata: Metadata = { title: "Equipe" };

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-marinho-950">Equipe</h1>
        <p className="mt-1 text-sm text-grafite-600">Quem pode entrar no painel e o que cada pessoa pode fazer.</p>
      </div>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-white" aria-hidden />}>
        <Team />
      </Suspense>
    </div>
  );
}

async function Team() {
  const [me, { members, canManage }] = await Promise.all([requireOwner(), getTeam()]);
  return <TeamManager members={members} canManage={canManage} meId={me.id} />;
}
