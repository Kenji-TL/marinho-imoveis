import { Award, Handshake, Scale, ShieldCheck } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, title: "Contratos seguros", text: "Revisados pelo nosso jurídico" },
  { icon: Handshake, title: "Atendimento próximo", text: "Do contato à entrega das chaves" },
  { icon: Scale, title: "Segurança jurídica", text: "Especialistas em direito imobiliário" },
  { icon: Award, title: "Tradição desde 1982", text: "Mais de 40 anos no mercado" },
];

/** Faixa de selos de confiança abaixo da busca */
export function TrustStrip() {
  return (
    <ul className="grid grid-cols-2 gap-y-6 lg:grid-cols-4 lg:divide-x lg:divide-areia-300">
      {ITEMS.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-center gap-3 px-2 lg:justify-center lg:px-6">
          <Icon className="size-8 shrink-0 text-marinho-950" strokeWidth={1.4} aria-hidden />
          <span>
            <span className="block text-sm font-semibold text-marinho-950">{title}</span>
            <span className="block text-xs text-grafite-600">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
