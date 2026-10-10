import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/admin/form-skeleton";
import { PropertyForm } from "@/components/admin/property-form";
import { EMPTY_PROPERTY } from "@/lib/admin/property-form-state";
import { getKnownNeighborhoods } from "@/lib/admin/queries";

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
      <Suspense fallback={<FormSkeleton />}>
        <NewPropertyForm />
      </Suspense>
    </div>
  );
}

async function NewPropertyForm() {
  const neighborhoods = await getKnownNeighborhoods();
  return <PropertyForm initial={EMPTY_PROPERTY} neighborhoods={neighborhoods} />;
}

