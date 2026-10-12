import { Clock, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { formatPhone } from "@/lib/format";
import { getSettings } from "@/lib/public/queries";
import { GENERIC_WHATSAPP_MESSAGE, whatsappLink } from "@/lib/whatsapp";
import { Logo } from "./logo";
import { FacebookIcon, InstagramIcon } from "./social-icons";
import { WhatsappIcon } from "./whatsapp-icon";

const QUICK_LINKS = [
  { href: "/", label: "Início" },
  { href: "/comprar", label: "Comprar" },
  { href: "/alugar", label: "Alugar" },
  { href: "/sobre", label: "Sobre a Marinho" },
  { href: "/contato", label: "Contato" },
];

const TYPE_LINKS = [
  { href: "/comprar?tipo=apartamento", label: "Apartamentos à venda" },
  { href: "/comprar?tipo=casa", label: "Casas à venda" },
  { href: "/alugar?tipo=apartamento", label: "Apartamentos para alugar" },
  { href: "/alugar?tipo=sala_comercial", label: "Salas comerciais" },
  { href: "/alugar?tipo=loja", label: "Lojas" },
];

export async function SiteFooter() {
  const s = await getSettings();
  const year = new Date().getFullYear();
  const whatsapp = whatsappLink(s.whatsapp, GENERIC_WHATSAPP_MESSAGE);
  const heading = "text-sm font-semibold text-marinho-950";
  const link = "text-sm text-grafite-600 transition hover:text-marinho-950";
  const social = "flex size-11 items-center justify-center rounded-full border border-areia-300 bg-white text-marinho-950 transition hover:border-marinho-950 hover:bg-marinho-950 hover:text-white";

  return (
    <footer className="mt-auto border-t border-areia-300 bg-areia-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.2fr_1.5fr_auto]">
        <div className="space-y-5">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-grafite-600">
            A seriedade é a base de nossas atividades. Venda, aluguel e administração de imóveis no Rio de Janeiro.
          </p>
          <div className="flex gap-2">
            {s.instagram_url && (
              <a href={s.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={social}>
                <InstagramIcon className="size-4" />
              </a>
            )}
            {s.facebook_url && (
              <a href={s.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={social}>
                <FacebookIcon className="size-4" />
              </a>
            )}
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={social}>
              <WhatsappIcon className="size-4" />
            </a>
          </div>
        </div>

        <nav aria-label="Links rápidos" className="space-y-4">
          <p className={heading}>Links rápidos</p>
          <ul className="space-y-2.5">
            {QUICK_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={link}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Tipos de imóvel" className="space-y-4">
          <p className={heading}>Tipos de imóvel</p>
          <ul className="space-y-2.5">
            {TYPE_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={link}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <address className="space-y-4 not-italic">
          <p className={heading}>Contato</p>
          <ul className="space-y-3 text-sm text-grafite-600">
            {s.address && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-dourado-500" aria-hidden />
                <span className="whitespace-pre-line">{s.address}</span>
              </li>
            )}
            <li className="flex gap-3">
              <WhatsappIcon className="mt-0.5 size-4 shrink-0 text-dourado-500" />
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={link}>{formatPhone(s.whatsapp)}</a>
            </li>
            {s.phone && (
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-dourado-500" aria-hidden />
                <a href={`tel:+55${s.phone.replace(/\D/g, "")}`} className={link}>{s.phone}</a>
              </li>
            )}
            {s.email && (
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-dourado-500" aria-hidden />
                <a href={`mailto:${s.email}`} className={`${link} break-all`}>{s.email}</a>
              </li>
            )}
            {s.opening_hours && (
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-dourado-500" aria-hidden />
                <span>{s.opening_hours}</span>
              </li>
            )}
          </ul>
        </address>

        <p className="hidden -rotate-6 self-center font-script font-semibold text-3xl leading-tight text-marinho-700 lg:block" aria-hidden>
          Morar,
          <br />
          investir,
          <br />
          crescer.
        </p>
      </div>

      <div className="border-t border-areia-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-grafite-600 sm:flex-row sm:justify-between sm:px-6">
          <p>© {year} {s.company_name}. Todos os direitos reservados.</p>
          <p>{s.creci ? `CRECI ${s.creci} · ` : ""}Ilha do Governador · Rio de Janeiro/RJ</p>
        </div>
      </div>
    </footer>
  );
}
