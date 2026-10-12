import type { Metadata } from "next";
import { AuthCard } from "@/components/admin/auth-card";
import { WithLinkSession } from "./with-link-session";

export const metadata: Metadata = { title: "Criar senha", robots: { index: false, follow: false } };

export default function SetPasswordPage() {
  return (
    <AuthCard title="Crie sua senha">
      <WithLinkSession />
    </AuthCard>
  );
}
