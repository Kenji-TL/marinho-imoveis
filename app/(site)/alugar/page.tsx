import type { Metadata } from "next";
import { ListingPage } from "@/components/site/listing-page";

export const metadata: Metadata = {
  title: "Imóveis para alugar no Rio de Janeiro",
  description:
    "Apartamentos, casas, lojas e salas para alugar na Ilha do Governador e em todo o Rio de Janeiro. Fale direto no WhatsApp.",
  alternates: { canonical: "/alugar" },
};

export default function RentPage() {
  return <ListingPage deal="rent" />;
}
