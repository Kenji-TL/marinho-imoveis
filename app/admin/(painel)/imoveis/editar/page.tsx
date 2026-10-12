import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/admin/form-skeleton";
import { EditPropertyView } from "./edit-view";

export const metadata: Metadata = { title: "Editar imóvel" };

// O imóvel vem na URL: /admin/imoveis/editar?id=...
export default function EditPropertyPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/imoveis" className="text-sm text-marinho-700 hover:underline">
          ← Imóveis
        </Link>
        <h1 className="mt-1 font-serif text-3xl text-marinho-950">Editar imóvel</h1>
      </div>
      <Suspense fallback={<FormSkeleton />}>
        <EditPropertyView />
      </Suspense>
    </div>
  );
}
