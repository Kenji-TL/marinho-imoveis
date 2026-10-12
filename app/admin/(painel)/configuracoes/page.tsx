import type { Metadata } from "next";
import { OwnerOnly } from "@/components/admin/session";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-serif text-3xl text-marinho-950">Configurações</h1>
      <OwnerOnly>
        <SettingsView />
      </OwnerOnly>
    </div>
  );
}
