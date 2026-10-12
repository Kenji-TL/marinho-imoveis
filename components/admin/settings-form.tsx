"use client";

import { Loader2, MessageCircle, Save } from "lucide-react";
import { useActionState, useState } from "react";
import { saveSettings, type SettingsState } from "@/lib/admin/api";
import type { Tables } from "@/lib/database.types";
import { formatPhone, normalizeWhatsapp } from "@/lib/format";
import { buttonPrimary, Field, inputClass, Notice, Section } from "./ui";

export function SettingsForm({ settings }: { settings: Tables<"settings"> }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, undefined);
  const [whatsapp, setWhatsapp] = useState(formatPhone(settings.whatsapp));
  const errors = state && !state.ok ? state.errors : {};
  const failedValues = state && !state.ok ? state.values : undefined;
  const value = (key: keyof Tables<"settings">) => failedValues?.[key] ?? String(settings[key] ?? "");
  const waNumber = normalizeWhatsapp(whatsapp);

  const input = (name: keyof Tables<"settings">, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input
      id={name}
      name={name}
      defaultValue={value(name)}
      key={`${name}-${state?.ok ? state.savedAt : "x"}`}
      aria-invalid={errors[name] ? true : undefined}
      className={inputClass}
      {...props}
    />
  );

  return (
    <form action={action} className="space-y-6" noValidate>
      {state && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}

      <Section title="WhatsApp" description="Número que recebe as mensagens dos botões do site.">
        <Field label="Número do WhatsApp" htmlFor="whatsapp" required error={errors.whatsapp} hint="Com DDD. Ex.: (21) 99780-1515">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="whatsapp"
              name="whatsapp"
              inputMode="tel"
              autoComplete="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
              aria-invalid={errors.whatsapp ? true : undefined}
              className={`${inputClass} sm:max-w-xs`}
            />
            <a
              href={waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Teste do site Marinho Imóveis")}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!waNumber}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border border-areia-300 px-4 py-2.5 text-sm font-semibold ${
                waNumber ? "text-whatsapp-700 hover:border-whatsapp-600" : "pointer-events-none text-grafite-600 opacity-50"
              }`}
            >
              <MessageCircle className="size-4" aria-hidden /> Testar
            </a>
          </div>
        </Field>
      </Section>

      <Section title="Contato e endereço" description="Aparecem no rodapé e na página de contato.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome da empresa" htmlFor="company_name" required error={errors.company_name}>
            {input("company_name")}
          </Field>
          <Field label="CRECI" htmlFor="creci" error={errors.creci}>
            {input("creci")}
          </Field>
          <Field label="Telefone fixo" htmlFor="phone" error={errors.phone}>
            {input("phone", { inputMode: "tel", autoComplete: "tel" })}
          </Field>
          <Field label="E-mail" htmlFor="email" error={errors.email}>
            {input("email", { type: "email", inputMode: "email", autoComplete: "email" })}
          </Field>
          <Field label="Endereço" htmlFor="address" error={errors.address} className="sm:col-span-2" hint="Pode usar mais de uma linha.">
            <textarea
              id="address"
              name="address"
              rows={3}
              defaultValue={value("address")}
              key={`address-${state?.ok ? state.savedAt : "x"}`}
              className={inputClass}
            />
          </Field>
          <Field label="Horário de atendimento" htmlFor="opening_hours" error={errors.opening_hours} className="sm:col-span-2" hint="Ex.: Segunda a sexta, das 9h às 18h. Sábado, das 9h às 12h.">
            {input("opening_hours")}
          </Field>
        </div>
      </Section>

      <Section title="Redes sociais">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram" htmlFor="instagram_url" error={errors.instagram_url} hint="Link completo do perfil">
            {input("instagram_url", { inputMode: "url", placeholder: "https://instagram.com/…" })}
          </Field>
          <Field label="Facebook" htmlFor="facebook_url" error={errors.facebook_url} hint="Link completo da página">
            {input("facebook_url", { inputMode: "url", placeholder: "https://facebook.com/…" })}
          </Field>
        </div>
      </Section>

      <Section title="Sobre a imobiliária" description="Texto da página Sobre e da seção institucional da página inicial.">
        <Field label="Texto" htmlFor="about_text" error={errors.about_text}>
          <textarea
            id="about_text"
            name="about_text"
            rows={8}
            defaultValue={value("about_text")}
            key={`about-${state?.ok ? state.savedAt : "x"}`}
            className={inputClass}
          />
        </Field>
      </Section>

      <div className="sticky bottom-0 -mx-4 border-t border-areia-300 bg-areia-100/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <button type="submit" disabled={pending} className={`${buttonPrimary} w-full py-3 text-base sm:w-auto`}>
          {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Save className="size-5" aria-hidden />}
          {pending ? "Salvando…" : "Salvar configurações"}
        </button>
      </div>
    </form>
  );
}
