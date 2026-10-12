"use client";

import { FormSkeleton } from "@/components/admin/form-skeleton";
import { PropertyForm } from "@/components/admin/property-form";
import { getKnownNeighborhoods } from "@/lib/admin/api";
import { EMPTY_PROPERTY } from "@/lib/admin/property-form-state";
import { useLoad } from "@/lib/admin/use-load";

export function NewPropertyView() {
  const { data: neighborhoods, error } = useLoad(getKnownNeighborhoods);
  // Sem a lista de bairros o formulário funciona do mesmo jeito (só não sugere)
  if (!neighborhoods && !error) return <FormSkeleton />;
  return <PropertyForm initial={EMPTY_PROPERTY} neighborhoods={neighborhoods ?? []} />;
}
