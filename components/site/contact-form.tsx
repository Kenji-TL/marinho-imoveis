"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { whatsappLink } from "@/lib/whatsapp";

const SUBJECTS = ["Quero comprar um imóvel", "Quero alugar um imóvel", "Quero vender meu imóvel", "Quero colocar meu imóvel para alugar", "Outro assunto"];

const field =
  "block w-full rounded-xl border border-areia-300 bg-white px-4 py-3 text-base text-grafite-900 outline-none transition placeholder:text-grafite-600 focus:border-marinho-700 focus:ring-2 focus:ring-marinho-100";

/** Formulário que abre o WhatsApp com a mensagem já escrita (sem servidor de e-mail) */
export function ContactForm({ whatsapp }: { whatsapp: string }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const name = String(data.get("nome") ?? "").trim();
        const subject = String(data.get("assunto") ?? "");
        const message = String(data.get("mensagem") ?? "").trim();
        if (!name || !message) {
          setError("Preencha seu nome e a mensagem.");
          return;
        }
        setError(null);
        const text = `Olá! Vim pelo site. Meu nome é ${name}.\nAssunto: ${subject}\n\n${message}`;
        window.open(whatsappLink(whatsapp, text), "_blank", "noopener,noreferrer");
      }}
      noValidate
    >
      <div>
        <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-grafite-700">Seu nome</label>
        <input id="nome" name="nome" autoComplete="name" className={field} />
      </div>
      <div>
        <label htmlFor="assunto" className="mb-1.5 block text-sm font-medium text-grafite-700">Assunto</label>
        <select id="assunto" name="assunto" className={field}>
          {SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="mensagem" className="mb-1.5 block text-sm font-medium text-grafite-700">Mensagem</label>
        <textarea id="mensagem" name="mensagem" rows={5} className={field} placeholder="Conte o que você procura: bairro, quartos, faixa de valor…" />
      </div>
      <p role="alert" className="min-h-5 text-sm text-vermelho-700">{error}</p>
      <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-whatsapp-700 sm:w-auto">
        <Send className="size-5" aria-hidden /> Enviar pelo WhatsApp
      </button>
      <p className="text-xs text-grafite-600">A mensagem abre no seu WhatsApp, pronta para enviar.</p>
    </form>
  );
}
