import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/admin/auth-card";
import { requireAdmin } from "@/lib/auth";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "Criar senha", robots: { index: false, follow: false } };

export default function SetPasswordPage() {
  return (
    <AuthCard title="Crie sua senha">
      <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-areia-100" aria-hidden />}>
        <WithUser />
      </Suspense>
    </AuthCard>
  );
}

async function WithUser() {
  const me = await requireAdmin();
  return <NewPasswordForm email={me.email} />;
}
