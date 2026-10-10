import Link from "next/link";
import { btnDark, btnOutline } from "@/components/site/buttons";
import { Logo } from "@/components/site/logo";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-areia-100 px-4 py-20 text-center">
      <Link href="/" aria-label="Marinho Imóveis — página inicial">
        <Logo />
      </Link>
      <p className="mt-12 font-serif text-7xl text-marinho-950 lining-nums">404</p>
      <h1 className="mt-4 font-serif text-3xl text-marinho-950">Página não encontrada</h1>
      <p className="mt-3 max-w-md text-grafite-600">O endereço pode estar errado ou a página foi retirada do ar.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={btnDark}>
          Ir para o início
        </Link>
        <Link href="/comprar" className={btnOutline}>
          Ver imóveis
        </Link>
      </div>
    </main>
  );
}
