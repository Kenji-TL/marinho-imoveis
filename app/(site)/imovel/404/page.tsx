import type { Metadata } from "next";
import { MovedPropertyRedirect } from "@/components/site/moved-property-redirect";
import { getSlugsByCode } from "@/lib/public/queries";
import PropertyNotFound from "../[slug]/not-found";

// Vira /imovel/404.html: a Cloudflare mostra esta página (com status 404) para
// qualquer endereço de imóvel que não existe mais.
export const metadata: Metadata = {
  title: "Anúncio indisponível",
  robots: { index: false, follow: true },
};

export default async function PropertyGonePage() {
  const slugsByCode = await getSlugsByCode();
  return (
    <>
      <MovedPropertyRedirect slugsByCode={slugsByCode} />
      <PropertyNotFound />
    </>
  );
}
