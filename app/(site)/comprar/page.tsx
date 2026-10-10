import type { Metadata } from "next";
import { ListingPage } from "@/components/site/listing-page";

export const metadata: Metadata = {
  title: "Imóveis à venda no Rio de Janeiro",
  description:
    "Casas e apartamentos à venda na Ilha do Governador e em todo o Rio de Janeiro, com departamento jurídico próprio.",
  alternates: { canonical: "/comprar" },
};

export default function SalePage({ searchParams }: PageProps<"/comprar">) {
  return <ListingPage deal="sale" searchParams={searchParams} />;
}
