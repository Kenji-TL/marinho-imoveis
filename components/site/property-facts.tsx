import { Bath, BedDouble, Car, Ruler } from "lucide-react";
import { formatArea } from "@/lib/format";

type Facts = {
  bedrooms: number;
  bathrooms: number;
  parking_spots: number;
  usable_area: number | null;
  total_area: number | null;
};

/** Linha compacta de características (some o que for zero) */
export function PropertyFactsInline({ p, className = "" }: { p: Facts; className?: string }) {
  const area = p.usable_area ?? p.total_area;
  const items = [
    p.bedrooms > 0 && { icon: BedDouble, label: `${p.bedrooms} ${p.bedrooms === 1 ? "quarto" : "quartos"}` },
    p.bathrooms > 0 && { icon: Bath, label: `${p.bathrooms} ${p.bathrooms === 1 ? "banheiro" : "banheiros"}` },
    p.parking_spots > 0 && { icon: Car, label: `${p.parking_spots} ${p.parking_spots === 1 ? "vaga" : "vagas"}` },
    area && { icon: Ruler, label: formatArea(area) },
  ].filter(Boolean) as { icon: typeof Bath; label: string }[];

  if (!items.length) return null;
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-grafite-600 ${className}`}>
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-1.5">
          <Icon className="size-4 text-marinho-700" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function DealTag({ deal, className = "" }: { deal: "rent" | "sale"; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-[0.1em] text-white uppercase shadow-sm ${
        deal === "rent" ? "bg-marinho-700" : "bg-vermelho-600"
      } ${className}`}
    >
      {deal === "rent" ? "Aluguel" : "Venda"}
    </span>
  );
}

export function SoftTag({ children, tone = "light" }: { children: React.ReactNode; tone?: "light" | "amber" | "dark" }) {
  const tones = {
    light: "bg-white/95 text-marinho-950",
    amber: "bg-amber-100 text-amber-900",
    dark: "bg-grafite-900/85 text-white",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${tones[tone]}`}>
      {children}
    </span>
  );
}
