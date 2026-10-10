import { Suspense } from "react";
import { FloatingWhatsapp } from "@/components/site/floating-whatsapp";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { getSettings } from "@/lib/public/queries";
import { GENERIC_WHATSAPP_MESSAGE, whatsappLink } from "@/lib/whatsapp";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <Suspense fallback={null}>
        <FloatingWhatsapp href={whatsappLink(settings.whatsapp, GENERIC_WHATSAPP_MESSAGE)} />
      </Suspense>
    </>
  );
}
