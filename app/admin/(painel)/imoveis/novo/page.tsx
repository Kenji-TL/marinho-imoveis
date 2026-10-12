import type { Metadata } from "next";
import Link from "next/link";
import { NewPropertyView } from "./new-view";

export const metadata: Metadata = { title: "Novo imóvel" };

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/imoveis" className="text-sm text-marinho-700 hover:underline">
          ← Imóveis
        </Link>
        <h1 className="mt-1 font-serif text-3xl text-marinho-950">Novo imóvel</h1>
      </div>
      <NewPropertyView />
    </div>
  );
}
