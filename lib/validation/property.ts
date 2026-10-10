import { z } from "zod";
import {
  MAX_PHOTOS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  STATUS_BY_DEAL,
  STATUS_LABEL,
} from "@/lib/property-options";

const money = z.number().min(0, "O valor não pode ser negativo.").max(999_999_999, "Valor muito alto.").nullable();

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .nullable()
    .transform((v) => (v ? v : null));

const count = z.number().int().min(0).max(99);

const area = z.number().positive("A área precisa ser maior que zero.").max(9_999_999).nullable();

export const propertyImageSchema = z.object({
  id: z.uuid(),
  storage_path: z.string().min(1),
  position: z.number().int().min(0),
  is_cover: z.boolean(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});

export const propertySchema = z
  .object({
    id: z.uuid(),
    deal_type: z.enum(["rent", "sale"], { error: "Escolha Aluguel ou Venda." }),
    property_type: z.enum(PROPERTY_TYPES, { error: "Escolha o tipo do imóvel." }),
    title: z
      .string()
      .trim()
      .min(3, "Escreva um título para o anúncio.")
      .max(140, "Use no máximo 140 caracteres."),
    status: z.enum(PROPERTY_STATUSES),
    visible: z.boolean(),
    featured: z.boolean(),
    accepts_proposal: z.boolean(),

    rent_price: money,
    sale_price: money,
    condo_fee: money,
    iptu: money,
    iptu_exempt: z.boolean(),
    price_notes: optionalText(500),

    zip_code: z
      .string()
      .trim()
      .regex(/^(\d{5}-?\d{3})?$/, "CEP inválido.")
      .nullable()
      .transform((v) => (v ? v : null)),
    street: optionalText(160),
    number: optionalText(20),
    complement: optionalText(80),
    neighborhood: z.string().trim().min(2, "Informe o bairro.").max(80),
    city: z.string().trim().min(2, "Informe a cidade.").max(80),
    state: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "Use a sigla do estado, ex.: RJ."),
    hide_number: z.boolean(),

    bedrooms: count,
    suites: count,
    bathrooms: count,
    parking_spots: count,
    usable_area: area,
    total_area: area,

    amenities: z.array(z.string().trim().min(1).max(60)).max(60),
    description: z.string().max(20_000, "Descrição muito longa.").nullable(),

    images: z.array(propertyImageSchema).max(MAX_PHOTOS, `Envie no máximo ${MAX_PHOTOS} fotos.`),
  })
  .superRefine((v, ctx) => {
    if (v.deal_type === "rent" && !v.rent_price) {
      ctx.addIssue({ code: "custom", path: ["rent_price"], message: "Informe o valor do aluguel." });
    }
    if (v.deal_type === "sale" && !v.sale_price) {
      ctx.addIssue({ code: "custom", path: ["sale_price"], message: "Informe o valor de venda." });
    }
    if (!STATUS_BY_DEAL[v.deal_type].includes(v.status)) {
      ctx.addIssue({
        code: "custom",
        path: ["status"],
        message: `"${STATUS_LABEL[v.status]}" não combina com ${v.deal_type === "rent" ? "aluguel" : "venda"}.`,
      });
    }
    if (v.suites > v.bedrooms) {
      ctx.addIssue({ code: "custom", path: ["suites"], message: "Há mais suítes do que quartos." });
    }
    if (v.usable_area && v.total_area && v.usable_area > v.total_area) {
      ctx.addIssue({
        code: "custom",
        path: ["usable_area"],
        message: "A área útil é maior que a área total.",
      });
    }
    if (v.images.filter((i) => i.is_cover).length > 1) {
      ctx.addIssue({ code: "custom", path: ["images"], message: "Escolha apenas uma foto de capa." });
    }
  });

export type PropertyInput = z.input<typeof propertySchema>;
export type PropertyData = z.output<typeof propertySchema>;
export type PropertyImageInput = z.input<typeof propertyImageSchema>;

export type FieldErrors = Partial<Record<string, string>>;

/** Primeiro erro de cada campo, no formato { campo: mensagem } */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}
