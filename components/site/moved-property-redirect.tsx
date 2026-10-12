"use client";

import { useEffect } from "react";

/**
 * Link antigo de um imóvel cujo título mudou (o endereço muda junto): acha o
 * imóvel pelo código no fim do endereço e leva ao endereço atual.
 */
export function MovedPropertyRedirect({ slugsByCode }: { slugsByCode: Record<string, string> }) {
  useEffect(() => {
    const { pathname } = window.location;
    const code = pathname.match(/(mi-\d{4,})\/?$/i)?.[1]?.toLowerCase();
    const slug = code ? slugsByCode[code] : undefined;
    if (slug && pathname.replace(/\/$/, "") !== `/imovel/${slug}`) window.location.replace(`/imovel/${slug}`);
  }, [slugsByCode]);
  return null;
}
