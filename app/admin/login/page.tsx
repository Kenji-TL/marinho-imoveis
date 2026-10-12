import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { LoginForm, LoginFromUrl } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar no painel",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-areia-100 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image
            src="/logo-marinho-original.jpg"
            alt="Marinho Imóveis"
            width={523}
            height={147}
            priority
            className="h-auto w-56"
          />
          <p className="text-xs font-semibold tracking-[0.2em] text-grafite-600 uppercase">
            Painel administrativo
          </p>
        </div>

        <div className="rounded-xl border border-areia-300 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="mb-6 font-serif text-2xl text-marinho-950">Entrar</h1>
          <Suspense fallback={<LoginForm next="/admin" />}>
            <LoginFromUrl />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
