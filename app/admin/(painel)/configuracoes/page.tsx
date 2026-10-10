import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettingsForAdmin } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-serif text-3xl text-marinho-950">Configurações</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-white" aria-hidden />}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  const settings = await getSettingsForAdmin();
  return <SettingsForm settings={settings} />;
}
