import type { ReactNode } from "react";

/** Título de seção: chamada pequena em caixa alta + título em serifa */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  action?: ReactNode;
}) {
  const center = align === "center";
  const dark = tone === "dark";
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${center ? "flex-col items-center text-center" : ""}`}>
      <div className="max-w-2xl">
        {eyebrow && (
          <p className={`mb-2 text-[0.7rem] font-semibold tracking-[0.25em] uppercase ${dark ? "text-dourado-300" : "text-dourado-700"}`}>
            {eyebrow}
          </p>
        )}
        <h2 className={`font-serif text-3xl leading-tight sm:text-[2.5rem] ${dark ? "text-white" : "text-marinho-950"}`}>{title}</h2>
        {description && <p className={`mt-3 text-base leading-relaxed ${dark ? "text-marinho-100/80" : "text-grafite-600"}`}>{description}</p>}
      </div>
      {action}
    </div>
  );
}
