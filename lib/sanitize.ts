import "server-only";

import sanitizeHtml from "sanitize-html";

/**
 * Limpa o HTML da descrição: só parágrafos, negrito, itálico e listas.
 * Qualquer outra tag, atributo, script ou estilo é removido.
 */
export function sanitizeDescription(html: string | null | undefined): string | null {
  if (!html) return null;
  const clean = sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "ul", "ol", "li"],
    allowedAttributes: {},
    transformTags: { b: "strong", i: "em", div: "p", h1: "p", h2: "p", h3: "p" },
    exclusiveFilter: (frame) => frame.tag === "p" && !frame.text.trim() && !frame.mediaChildren.length,
  }).trim();
  return clean.replace(/<p>\s*<\/p>/g, "") || null;
}
