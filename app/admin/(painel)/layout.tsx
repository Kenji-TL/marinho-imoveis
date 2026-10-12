import type { Metadata } from "next";
import { PainelShell } from "@/components/admin/painel-shell";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel Marinho Imóveis" },
  robots: { index: false, follow: false },
};

export default function PainelLayout({ children }: LayoutProps<"/admin">) {
  return <PainelShell>{children}</PainelShell>;
}
