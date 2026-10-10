import { FileCheck2, Handshake, KeyRound, Scale } from "lucide-react";

const ITEMS = [
  {
    icon: Handshake,
    title: "Seriedade desde 1982",
    text: "Mais de 40 anos de mercado e uma reputação construída no boca a boca, negócio após negócio.",
  },
  {
    icon: Scale,
    title: "Departamento jurídico próprio",
    text: "Advogados especializados em direito imobiliário acompanham cada contrato, do começo ao fim.",
  },
  {
    icon: KeyRound,
    title: "Administração completa",
    text: "Cuidamos do seu imóvel alugado: análise do inquilino, contrato, cobrança e seguro.",
  },
  {
    icon: FileCheck2,
    title: "Legalização de imóveis",
    text: "Orientação para documentação, escritura e registro, sem dor de cabeça.",
  },
];

/** O que a Marinho faz: ícone redondo ao lado do texto (mesmo estilo da página inicial) */
export function Differentials() {
  return (
    <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      {ITEMS.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-marinho-950 ring-1 ring-areia-300">
            <Icon className="size-5" strokeWidth={1.6} aria-hidden />
          </span>
          <span>
            <span className="block font-serif text-xl text-marinho-950">{title}</span>
            <span className="mt-1.5 block max-w-md leading-relaxed text-grafite-600">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
