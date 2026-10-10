import Link from "next/link";
import { btnDark, btnGold } from "@/components/site/buttons";

export default function PropertyNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="font-serif text-4xl text-marinho-950">Este anúncio não está mais disponível</h1>
      <p className="mt-4 text-grafite-600">Ele pode ter sido retirado do site. Veja outras opções:</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/comprar" className={btnDark}>
          Imóveis à venda
        </Link>
        <Link href="/alugar" className={btnGold}>
          Imóveis para alugar
        </Link>
      </div>
    </div>
  );
}
