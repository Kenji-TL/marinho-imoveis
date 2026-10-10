import type { Metadata } from "next";
import { AuthCard } from "@/components/admin/auth-card";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Esqueci minha senha", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Esqueci minha senha">
      <ResetForm />
    </AuthCard>
  );
}
