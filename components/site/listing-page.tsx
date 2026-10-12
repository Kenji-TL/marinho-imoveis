import Link from "next/link";
import { Suspense } from "react";
import type { DealType } from "@/lib/property-options";
import { getDealCards, getNeighborhoods } from "@/lib/public/queries";
import { ListingResultsDefault, ListingResultsFromUrl } from "./listing-results";

const COPY: Record<DealType, { title: string; description: string; eyebrow: string }> = {
  rent: {
    eyebrow: "Alugar",
    title: "Imóveis para alugar",
    description: "Apartamentos, casas, lojas e salas para alugar na Ilha do Governador e em todo o Rio de Janeiro.",
  },
  sale: {
    eyebrow: "Comprar",
    title: "Imóveis à venda",
    description: "Encontre sua casa própria ou seu próximo investimento, com a segurança do nosso departamento jurídico.",
  },
};

export async function ListingPage({ deal }: { deal: DealType }) {
  const copy = COPY[deal];
  const [cards, neighborhoods] = await Promise.all([getDealCards(deal), getNeighborhoods()]);
  const props = { deal, cards, neighborhoods: neighborhoods[deal] };

  return (
    <>
      <section className="border-b border-areia-300 bg-areia-100">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <nav aria-label="Você está em" className="text-sm text-grafite-600">
            <Link href="/" className="hover:text-marinho-950">Início</Link> <span aria-hidden>/</span> {copy.eyebrow}
          </nav>
          <h1 className="mt-3 font-serif text-4xl text-marinho-950 sm:text-5xl">{copy.title}</h1>
          <p className="mt-3 max-w-2xl text-grafite-600">{copy.description}</p>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* A página pronta mostra todos os imóveis; com filtros na URL, o navegador refaz a lista */}
        <Suspense fallback={<ListingResultsDefault {...props} />}>
          <ListingResultsFromUrl {...props} />
        </Suspense>
      </div>
    </>
  );
}
