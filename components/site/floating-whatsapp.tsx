"use client";

import { usePathname } from "next/navigation";
import { WhatsappIcon } from "./whatsapp-icon";

/**
 * Botão flutuante de WhatsApp em todas as páginas. Na página do imóvel ele
 * sai de cena, porque lá existe o botão com a mensagem do próprio imóvel.
 */
export function FloatingWhatsapp({ href }: { href: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/imovel/")) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Marinho Imóveis no WhatsApp"
      className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-whatsapp-600 text-white shadow-lg shadow-black/20 transition hover:scale-105 hover:bg-whatsapp-700 sm:right-6 sm:bottom-6"
    >
      <WhatsappIcon className="size-7" />
    </a>
  );
}
