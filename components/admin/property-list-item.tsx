import { EyeOff, ImageOff, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { PropertyListItem } from "@/lib/admin/queries";
import { formatBRL } from "@/lib/format";
import { DEAL_LABEL, STATUS_LABEL } from "@/lib/property-options";
import { PropertyRowActions } from "./property-row-actions";

export function DealBadge({ deal }: { deal: PropertyListItem["deal_type"] }) {
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-white uppercase ${
        deal === "rent" ? "bg-marinho-700" : "bg-vermelho-600"
      }`}
    >
      {DEAL_LABEL[deal]}
    </span>
  );
}

export function StatusBadge({ status }: { status: PropertyListItem["status"] }) {
  const tones = {
    available: "bg-green-50 text-green-800 ring-green-200",
    reserved: "bg-amber-50 text-amber-800 ring-amber-200",
    rented: "bg-areia-200 text-grafite-700 ring-areia-300",
    sold: "bg-areia-200 text-grafite-700 ring-areia-300",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PropertyListRow({ item }: { item: PropertyListItem }) {
  const price = item.deal_type === "rent" ? item.rent_price : item.sale_price;
  return (
    <li className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
      <Link href={`/admin/imoveis/${item.id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-areia-200 sm:h-16 sm:w-24">
          {item.cover_url ? (
            <Image src={item.cover_url} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-grafite-600">
              <ImageOff className="size-5" aria-label="Sem fotos" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <DealBadge deal={item.deal_type} />
            <StatusBadge status={item.status} />
            {!item.visible && (
              <span className="inline-flex items-center gap-1 text-xs text-grafite-600">
                <EyeOff className="size-3.5" aria-hidden /> Oculto
              </span>
            )}
            {item.featured && (
              <span className="inline-flex items-center gap-1 text-xs text-marinho-700">
                <Star className="size-3.5 fill-current" aria-hidden /> Destaque
              </span>
            )}
          </div>
          <p className="line-clamp-2 font-medium text-grafite-900 sm:truncate">{item.title}</p>
          <p className="text-sm text-grafite-600">
            <span className="font-semibold tracking-wide text-grafite-700">{item.code}</span> · {item.neighborhood}
            {price != null && (
              <>
                {" "}
                · <span className="text-grafite-900">{formatBRL(price)}</span>
                {item.deal_type === "rent" && "/mês"}
              </>
            )}
          </p>
        </div>
      </Link>
      <div className="shrink-0 self-start sm:self-center">
        <PropertyRowActions id={item.id} slug={item.slug} title={item.title} visible={item.visible} />
      </div>
    </li>
  );
}
