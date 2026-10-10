import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/site/contact-form";
import { WhatsappIcon } from "@/components/site/whatsapp-icon";
import { formatPhone } from "@/lib/format";
import { getSettings } from "@/lib/public/queries";
import { GENERIC_WHATSAPP_MESSAGE, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a Marinho Imóveis pelo WhatsApp, telefone ou e-mail. Rua República Árabe da Síria, 129 — Portuguesa, Ilha do Governador.",
  alternates: { canonical: "/contato" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const mapQuery = (s.address ?? "").split("\n").slice(0, 2).join(", ") || "Ilha do Governador, Rio de Janeiro";

  const channels = [
    {
      icon: WhatsappIcon,
      label: "WhatsApp",
      value: formatPhone(s.whatsapp),
      href: whatsappLink(s.whatsapp, GENERIC_WHATSAPP_MESSAGE),
      external: true,
      highlight: true,
    },
    s.phone && { icon: Phone, label: "Telefone", value: s.phone, href: `tel:+55${s.phone.replace(/\D/g, "")}` },
    s.email && { icon: Mail, label: "E-mail", value: s.email, href: `mailto:${s.email}` },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string; external?: boolean; highlight?: boolean }[];

  return (
    <>
      <section className="border-b border-areia-300 bg-areia-100">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <p className="text-[0.7rem] font-semibold tracking-[0.25em] text-dourado-700 uppercase">Contato</p>
          <h1 className="mt-4 font-serif text-4xl text-marinho-950 sm:text-5xl">Fale com a gente</h1>
          <p className="mt-3 max-w-2xl text-grafite-600">
            Atendimento pelo WhatsApp, telefone, e-mail ou na nossa sede, na Ilha do Governador.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <ul className="grid gap-3">
            {channels.map(({ icon: Icon, label, value, href, external, highlight }) => (
              <li key={label}>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={`flex items-center gap-4 rounded-2xl border p-5 transition ${
                    highlight ? "border-whatsapp-600/30 bg-green-50 hover:border-whatsapp-600" : "border-areia-300 bg-white hover:border-marinho-700"
                  }`}
                >
                  <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${highlight ? "bg-whatsapp-600 text-white" : "bg-marinho-50 text-marinho-700"}`}>
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold tracking-[0.15em] text-grafite-600 uppercase">{label}</span>
                    <span className="block text-lg font-semibold [overflow-wrap:anywhere] text-grafite-900">{value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {(s.address || s.opening_hours) && (
            <div className="space-y-4 rounded-2xl border border-areia-300 bg-white p-6">
              {s.address && (
                <p className="flex gap-3 text-grafite-700">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-vermelho-600" aria-hidden />
                  <span className="whitespace-pre-line">{s.address}</span>
                </p>
              )}
              {s.opening_hours && (
                <p className="flex gap-3 text-grafite-700">
                  <Clock className="mt-0.5 size-5 shrink-0 text-vermelho-600" aria-hidden />
                  {s.opening_hours}
                </p>
              )}
              {s.creci && <p className="text-xs tracking-[0.18em] text-grafite-600 uppercase">CRECI {s.creci}</p>}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-areia-300">
            <iframe
              title="Mapa da sede da Marinho Imóveis"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&hl=pt-BR&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block aspect-[16/10] w-full"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-areia-300 bg-white p-6 shadow-xl shadow-marinho-950/5 sm:p-10">
          <h2 className="font-serif text-3xl text-marinho-950">Envie uma mensagem</h2>
          <p className="mt-2 mb-8 text-grafite-600">Responderemos o mais rápido possível no horário de atendimento.</p>
          <ContactForm whatsapp={s.whatsapp} />
        </div>
      </section>
    </>
  );
}
