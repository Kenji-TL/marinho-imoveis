"use client";

import { SettingsForm } from "@/components/admin/settings-form";
import { Notice } from "@/components/admin/ui";
import { getSettingsForAdmin } from "@/lib/admin/api";
import { useLoad } from "@/lib/admin/use-load";

export function SettingsView() {
  const { data, error } = useLoad(getSettingsForAdmin);
  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <div className="h-96 animate-pulse rounded-xl bg-white" aria-hidden />;
  return <SettingsForm settings={data} />;
}
