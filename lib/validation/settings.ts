import { z } from "zod";
import { normalizeWhatsapp } from "@/lib/format";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .transform((v) => (v ? v : null));

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
  .pipe(z.union([z.literal(""), z.url("Endereço inválido. Ex.: https://instagram.com/seuperfil")]))
  .transform((v) => (v ? v : null));

export const settingsSchema = z.object({
  company_name: z.string().trim().min(2, "Informe o nome da empresa.").max(80),
  whatsapp: z
    .string()
    .transform((v, ctx) => {
      const normalized = normalizeWhatsapp(v);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: "Informe o WhatsApp com DDD. Ex.: (21) 99780-1515" });
        return z.NEVER;
      }
      return normalized;
    }),
  phone: optionalText(40),
  email: z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), z.email("E-mail inválido.")]))
    .transform((v) => (v ? v : null)),
  creci: optionalText(20),
  address: optionalText(300),
  opening_hours: optionalText(160),
  instagram_url: optionalUrl,
  facebook_url: optionalUrl,
  about_text: optionalText(3000),
});

export type SettingsData = z.output<typeof settingsSchema>;
