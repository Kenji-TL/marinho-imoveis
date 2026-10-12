"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { FormSkeleton } from "@/components/admin/form-skeleton";
import { PropertyForm } from "@/components/admin/property-form";
import { buttonPrimary, Notice } from "@/components/admin/ui";
import { getKnownNeighborhoods, getPropertyForEdit, PUBLISH_NOTE } from "@/lib/admin/api";
import { toFormInitial } from "@/lib/admin/property-form-state";
import { useLoad } from "@/lib/admin/use-load";

const NOTICES: Record<string, string> = {
  "criado-ok": `Imóvel cadastrado! ${PUBLISH_NOTE.ok} Você pode continuar editando aqui.`,
  "criado-off": `Imóvel cadastrado! ${PUBLISH_NOTE.off}`,
  "criado-falha": `Imóvel cadastrado! ${PUBLISH_NOTE.falha}`,
  duplicado: "Cópia criada. Ela está oculta do site até você revisar e ligar “Mostrar no site”.",
};

export function EditPropertyView() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const aviso = params.get("aviso");
  const notice = aviso ? NOTICES[aviso] : undefined;

  const load = useCallback(() => Promise.all([getPropertyForEdit(id), getKnownNeighborhoods()]), [id]);
  const { data, error, loading } = useLoad(load);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data || loading) return <FormSkeleton />;

  const [property, neighborhoods] = data;
  if (!property) {
    return (
      <div className="rounded-xl border border-dashed border-areia-300 bg-white px-6 py-12 text-center">
        <p className="font-medium text-grafite-900">Imóvel não encontrado. Ele pode ter sido excluído.</p>
        <Link href="/admin/imoveis" className={`${buttonPrimary} mt-4`}>
          Ver os imóveis
        </Link>
      </div>
    );
  }

  return (
    <>
      {notice && <Notice tone="success">{notice}</Notice>}
      <PropertyForm key={property.id} initial={toFormInitial(property)} neighborhoods={neighborhoods} />
    </>
  );
}
