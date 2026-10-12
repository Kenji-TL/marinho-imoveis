import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmLink } from "./confirm-link";

export const metadata: Metadata = { title: "Entrando…", robots: { index: false, follow: false } };

// Destino dos links enviados por e-mail (convite e recuperação de senha)
export default function ConfirmLinkPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-areia-100 px-4 py-16 text-center">
      <Suspense fallback={<p className="text-grafite-600">Validando o link…</p>}>
        <ConfirmLink />
      </Suspense>
    </main>
  );
}
