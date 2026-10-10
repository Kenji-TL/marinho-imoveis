import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/admin/form-skeleton";
import { PropertyForm } from "@/components/admin/property-form";
import { Notice } from "@/components/admin/ui";
import { toFormInitial } from "@/lib/admin/property-form-state";
import { getKnownNeighborhoods, getPropertyForEdit } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Editar imóvel" };

const NOTICES: Record<string, string> = {
  criado: "Imóvel cadastrado! Você pode continuar editando aqui.",
  duplicado: "Cópia criada. Ela está oculta do site até você revisar e ligar “Mostrar no site”.",
};

export default function EditPropertyPage({ params, searchParams }: PageProps<"/admin/imoveis/[id]">) {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/imoveis" className="text-sm text-marinho-700 hover:underline">
          ← Imóveis
        </Link>
        <h1 className="mt-1 font-serif text-3xl text-marinho-950">Editar imóvel</h1>
      </div>
      <Suspense fallback={<FormSkeleton />}>
        <EditProperty params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function EditProperty({
  params,
  searchParams,
}: Pick<PageProps<"/admin/imoveis/[id]">, "params" | "searchParams">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [property, neighborhoods] = await Promise.all([getPropertyForEdit(id), getKnownNeighborhoods()]);
  if (!property) notFound();

  const notice = typeof query.aviso === "string" ? NOTICES[query.aviso] : undefined;

  return (
    <>
      {notice && <Notice tone="success">{notice}</Notice>}
      <PropertyForm key={property.id} initial={toFormInitial(property)} neighborhoods={neighborhoods} />
    </>
  );
}
