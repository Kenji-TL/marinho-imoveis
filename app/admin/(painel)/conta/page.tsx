import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountForms } from "@/components/admin/account-forms";
import { requireAdmin, ROLE_LABEL } from "@/lib/auth";

export const metadata: Metadata = { title: "Minha conta" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-serif text-3xl text-marinho-950">Minha conta</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white" aria-hidden />}>
        <Account />
      </Suspense>
    </div>
  );
}

async function Account() {
  const me = await requireAdmin();
  return <AccountForms name={me.name} email={me.email} roleLabel={ROLE_LABEL[me.role]} />;
}
