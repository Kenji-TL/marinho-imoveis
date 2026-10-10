import { Phone } from "lucide-react";
import { formatBRL } from "@/lib/format";
import type { PublicProperty } from "@/lib/public/queries";
import { WhatsappIcon } from "./whatsapp-icon";

type PriceFields = Pick<
  PublicProperty,
  "deal_type" | "rent_price" | "sale_price" | "condo_fee" | "iptu" | "iptu_exempt" | "price_notes" | "accepts_proposal" | "code"
>;

export function monthlyTotal(p: PriceFields) {
  if (p.deal_type !== "rent" || p.rent_price == null) return null;
  return p.rent_price + (p.condo_fee ?? 0) + (p.iptu_exempt ? 0 : (p.iptu ?? 0));
}

/** Bloco de valores: muda conforme aluguel ou venda */
export function PriceCard({
  p,
  whatsappHref,
  phone,
  closed,
}: {
  p: PriceFields;
  whatsappHref: string;
  phone: string | null;
  closed: boolean;
}) {
  const rent = p.deal_type === "rent";
  const main = rent ? p.rent_price : p.sale_price;
  const total = monthlyTotal(p);
  const row = "flex items-baseline justify-between gap-4 py-2.5 text-sm";

  return (
    <div className="rounded-2xl border border-areia-300 bg-white p-6 shadow-xl shadow-marinho-950/5">
      <p className="text-xs font-semibold tracking-[0.2em] text-grafite-600 uppercase">{rent ? "Aluguel" : "Valor de venda"}</p>
      {main != null && (
        <p className="mt-1 font-serif text-4xl text-marinho-950 lining-nums">
          {formatBRL(main)}
          {rent && <span className="font-sans text-base text-grafite-600">/mês</span>}
        </p>
      )}
      {p.accepts_proposal && (
        <p className="mt-3 inline-flex rounded-md bg-marinho-50 px-2.5 py-1 text-xs font-semibold text-marinho-700">Aceita proposta</p>
      )}

      <dl className="mt-5 divide-y divide-areia-200 border-y border-areia-200">
        {rent && main != null && (
          <div className={row}>
            <dt className="text-grafite-600">Aluguel</dt>
            <dd className="font-medium tabular-nums">{formatBRL(main)}</dd>
          </div>
        )}
        <div className={row}>
          <dt className="text-grafite-600">Condomínio</dt>
          <dd className="font-medium tabular-nums">{p.condo_fee != null ? formatBRL(p.condo_fee) : "Não informado"}</dd>
        </div>
        <div className={row}>
          <dt className="text-grafite-600">IPTU {rent ? "" : "(mensal)"}</dt>
          <dd className="font-medium tabular-nums">{p.iptu_exempt ? "Isento" : p.iptu != null ? formatBRL(p.iptu) : "Não informado"}</dd>
        </div>
        {total != null && (
          <div className="flex items-baseline justify-between gap-4 py-3.5">
            <dt className="font-semibold text-marinho-950">Total mensal</dt>
            <dd className="font-serif text-2xl text-marinho-700 tabular-nums lining-nums">{formatBRL(total)}</dd>
          </div>
        )}
      </dl>
      {p.price_notes && <p className="mt-3 text-xs text-grafite-600">{p.price_notes}</p>}

      <div className="mt-6 space-y-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 rounded-full bg-whatsapp-600 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-whatsapp-600/25 transition hover:bg-whatsapp-700"
        >
          <WhatsappIcon className="size-6" />
          {closed ? "Quero opções parecidas" : "Tenho interesse"}
        </a>
        {phone && (
          <a
            href={`tel:+55${phone.replace(/\D/g, "")}`}
            className="flex items-center justify-center gap-2 rounded-full border border-areia-300 px-5 py-3 text-sm font-semibold text-marinho-950 transition hover:border-marinho-700"
          >
            <Phone className="size-4" aria-hidden /> Ligar {phone}
          </a>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-grafite-600">
        Código do imóvel: <strong className="tracking-wide text-grafite-700">{p.code}</strong>
      </p>
    </div>
  );
}
