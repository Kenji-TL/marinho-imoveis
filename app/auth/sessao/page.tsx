import type { Metadata } from "next";
import { Suspense } from "react";
import { HashSession } from "./hash-session";

export const metadata: Metadata = { title: "Entrando…", robots: { index: false, follow: false } };

export default function SessionFromLinkPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-areia-100 px-4 py-16 text-center">
      <Suspense fallback={<p className="text-grafite-600">Validando o link…</p>}>
        <HashSession />
      </Suspense>
    </main>
  );
}
