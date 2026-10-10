"use server";

import { updateTag } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { createClient } from "@/lib/supabase/server";
import { settingsSchema } from "@/lib/validation/settings";

export type SettingsState =
  | { ok: true; message: string; savedAt: number }
  | { ok: false; message: string; errors: Partial<Record<string, string>>; values: Record<string, string> }
  | undefined;

const FIELDS = [
  "company_name",
  "whatsapp",
  "phone",
  "email",
  "creci",
  "address",
  "opening_hours",
  "instagram_url",
  "facebook_url",
  "about_text",
] as const;

export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireOwner();

  const values = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) {
    const errors: Partial<Record<string, string>> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: "Confira os campos destacados.", errors, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("settings").update(parsed.data).eq("id", 1);
  if (error) {
    return { ok: false, message: `Não foi possível salvar: ${error.message}`, errors: {}, values };
  }

  updateTag(CACHE_TAGS.settings);
  return { ok: true, message: "Configurações salvas.", savedAt: Date.now() };
}
