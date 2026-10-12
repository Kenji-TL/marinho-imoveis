import type { Metadata } from "next";
import { OwnerOnly } from "@/components/admin/session";
import { TeamView } from "./team-view";

export const metadata: Metadata = { title: "Equipe" };

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-marinho-950">Equipe</h1>
        <p className="mt-1 text-sm text-grafite-600">Quem pode entrar no painel e o que cada pessoa pode fazer.</p>
      </div>
      <OwnerOnly>
        <TeamView />
      </OwnerOnly>
    </div>
  );
}
