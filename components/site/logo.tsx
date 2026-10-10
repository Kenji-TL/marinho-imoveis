/**
 * Logo Marinho Imóveis redesenhado em SVG a partir do original:
 * telhado de tijolos vermelho, casa azul com o monograma "MI" e o nome em serifa.
 */
export function LogoMark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      {/* telhado */}
      <path d="M4 29 32 6l28 23z" fill="#E81C2B" />
      {/* fiadas de tijolos */}
      <path d="M13 22h38M21 15.5h22M25 22v7M39 22v7M32 15.5V22" stroke="#fff" strokeWidth="1.6" fill="none" opacity=".85" />
      {/* casa */}
      <rect x="11" y="29" width="42" height="29" fill="#020098" />
      {/* M */}
      <path d="M18 52V36l7.5 9.5L33 36v16" stroke="#fff" strokeWidth="4" fill="none" strokeLinejoin="miter" />
      {/* I vermelho, como a barra do logo original */}
      <rect x="40" y="36" width="5" height="16" fill="#E81C2B" />
    </svg>
  );
}

export function Logo({ variant = "light", className = "" }: { variant?: "light" | "dark"; className?: string }) {
  const dark = variant === "dark";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="size-10 shrink-0 sm:size-11" />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[1.35rem] font-bold tracking-tight sm:text-2xl">
          <span className={dark ? "text-white" : "text-vermelho-600"}>Marinho</span>{" "}
          <span className={dark ? "text-marinho-100" : "text-marinho-700"}>Imóveis</span>
        </span>
        <span
          className={`mt-1 text-[0.6875rem] font-semibold tracking-[0.14em] uppercase ${dark ? "text-marinho-100/80" : "text-grafite-600"}`}
        >
          Desde 1982 · Rio de Janeiro
        </span>
      </span>
    </span>
  );
}
