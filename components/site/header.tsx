import { ArrowRight, House } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getSettings } from "@/lib/public/queries";
import { GENERIC_WHATSAPP_MESSAGE, whatsappLink } from "@/lib/whatsapp";
import { HeaderNav, HeaderNavLinks } from "./header-nav";
import { Logo } from "./logo";

export const LIST_PROPERTY_MESSAGE = "Olá! Vim pelo site e gostaria de anunciar meu imóvel com a Marinho Imóveis.";

export async function SiteHeader() {
  const settings = await getSettings();
  const whatsappHref = whatsappLink(settings.whatsapp, GENERIC_WHATSAPP_MESSAGE);
  const listHref = whatsappLink(settings.whatsapp, LIST_PROPERTY_MESSAGE);

  return (
    <>
      {/* Faixa de aviso */}
      <div className="bg-marinho-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-1.5 text-xs sm:px-6">
          <House className="hidden size-4 text-dourado-300 sm:block" aria-hidden />
          <span className="truncate text-marinho-100">
            <span className="hidden sm:inline">Imobiliária de família na Ilha do Governador </span>desde 1982
          </span>
          <a
            href={listHref}
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex shrink-0 items-center gap-1.5 rounded-full bg-dourado-400 px-3.5 py-1.5 font-semibold text-marinho-950 transition before:absolute before:-inset-y-2 before:-inset-x-1 before:content-[''] hover:bg-dourado-300"
          >
            Anuncie seu imóvel <ArrowRight className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-areia-300/70 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:h-[4.75rem] sm:px-6">
          <Link href="/" aria-label={`${settings.company_name} — página inicial`} className="shrink-0">
            <Logo />
          </Link>
          <Suspense fallback={<HeaderNavLinks pathname={null} whatsappHref={whatsappHref} phone={settings.phone} />}>
            <HeaderNav whatsappHref={whatsappHref} phone={settings.phone} />
          </Suspense>
        </div>
      </header>
    </>
  );
}
