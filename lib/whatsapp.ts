import { formatBRL } from "@/lib/format";
import { absoluteUrl, propertyPath } from "@/lib/site";

export const GENERIC_WHATSAPP_MESSAGE = "Olá! Vim pelo site e gostaria de mais informações.";

/** Link do WhatsApp com a mensagem já escrita. `number` só com dígitos, com 55 + DDD. */
export function whatsappLink(number: string, message: string) {
  // Troca o espaço não separável da formatação de moeda por espaço comum
  const text = message.replace(/ /g, " ");
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

type PropertyForMessage = {
  title: string;
  code: string;
  slug: string;
  deal_type: "rent" | "sale";
  street: string | null;
  neighborhood: string;
  rent_price: number | null;
  sale_price: number | null;
};

/**
 * Mensagem que identifica exatamente o imóvel:
 * aluguel -> "...interesse no aluguel do imóvel X (código MI-0001), na Rua Y, Bairro, no valor de R$ 2.200/mês. Link: ..."
 * venda   -> "...interesse na compra do imóvel X (código MI-0004), na Rua Y, Bairro, no valor de R$ 1.800.000. Link: ..."
 */
export function propertyWhatsappMessage(p: PropertyForMessage) {
  const place = p.street ? `na ${p.street}, ${p.neighborhood}` : `no bairro ${p.neighborhood}`;
  const url = absoluteUrl(propertyPath(p.slug));
  if (p.deal_type === "rent") {
    const price = p.rent_price != null ? `, no valor de ${formatBRL(p.rent_price)}/mês` : "";
    return `Olá! Vim pelo site e tenho interesse no aluguel do imóvel ${p.title} (código ${p.code}), ${place}${price}. Link: ${url}`;
  }
  const price = p.sale_price != null ? `, no valor de ${formatBRL(p.sale_price)}` : "";
  return `Olá! Vim pelo site e tenho interesse na compra do imóvel ${p.title} (código ${p.code}), ${place}${price}. Link: ${url}`;
}
