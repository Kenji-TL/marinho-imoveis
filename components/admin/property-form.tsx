"use client";

import { Building2, ExternalLink, KeyRound, Loader2, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { PUBLISH_NOTE, saveProperty } from "@/lib/admin/api";
import type { PropertyFormInitial, PropertyFormValues } from "@/lib/admin/property-form-state";
import { formatBRLCents, formatCep, onlyDigits } from "@/lib/format";
import {
  AMENITIES,
  DEAL_LABEL,
  PROPERTY_TYPE_LABEL,
  PROPERTY_TYPES,
  STATUS_BY_DEAL,
  STATUS_LABEL,
  type DealType,
} from "@/lib/property-options";
import { propertySchema, toFieldErrors, type FieldErrors } from "@/lib/validation/property";
import { CurrencyInput, DecimalInput } from "./currency-input";
import { DeletePropertyButton } from "./delete-property-button";
import { NumberStepper } from "./number-stepper";
import { PhotoManager, type PhotoItem } from "./photo-manager";
import { RichTextEditor } from "./rich-text-editor";
import { buttonPrimary, Field, inputClass, Notice, Section, Toggle } from "./ui";

const NON_RESIDENTIAL = ["loja", "sala_comercial", "galpao", "terreno"];

function snapshot(values: PropertyFormValues, photos: PhotoItem[], coverId: string | null) {
  return JSON.stringify({ values, photos: photos.map((p) => p.id), coverId });
}

export function PropertyForm({
  initial,
  neighborhoods,
}: {
  initial: PropertyFormInitial;
  neighborhoods: string[];
}) {
  const router = useRouter();
  const idRef = useRef<string | null>(initial.id);
  // O id de um imóvel novo é criado só quando precisa (primeira foto ou ao salvar)
  const getId = useCallback(() => (idRef.current ??= crypto.randomUUID()), []);

  const [values, setValues] = useState(initial.values);
  const [photos, setPhotos] = useState<PhotoItem[]>(initial.photos);
  const [coverId, setCoverId] = useState(initial.coverId);
  const [meta, setMeta] = useState({ code: initial.code, slug: initial.slug });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [baseline, setBaseline] = useState(() => snapshot(initial.values, initial.photos, initial.coverId));
  const [pending, startTransition] = useTransition();
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "ok" | "notfound" | "error">("idle");

  const isNew = !initial.id;
  const dirty = snapshot(values, photos, coverId) !== baseline;
  const uploading = photos.some((p) => p.status === "uploading");
  const effectiveCover = coverId && photos.some((p) => p.id === coverId) ? coverId : photos[0]?.id ?? null;

  // Aviso ao fechar a aba com alterações não salvas
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function set<K extends keyof PropertyFormValues>(key: K, value: PropertyFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    if (message?.tone === "error") setMessage(null);
  }

  function setDeal(deal: DealType) {
    setValues((v) => ({
      ...v,
      deal_type: deal,
      status: STATUS_BY_DEAL[deal].includes(v.status) ? v.status : "available",
    }));
    setErrors((e) => ({ ...e, deal_type: undefined, status: undefined }));
  }

  async function lookupCep(raw: string) {
    const cep = onlyDigits(raw);
    if (cep.length !== 8) return;
    setCepStatus("loading");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepStatus("notfound");
        return;
      }
      setValues((v) => ({
        ...v,
        street: data.logradouro || v.street,
        neighborhood: data.bairro || v.neighborhood,
        city: data.localidade || v.city,
        state: data.uf || v.state,
      }));
      setErrors((e) => ({ ...e, neighborhood: undefined, city: undefined, zip_code: undefined }));
      setCepStatus("ok");
    } catch {
      setCepStatus("error");
    }
  }

  function suggestTitle() {
    const type = values.property_type ? PROPERTY_TYPE_LABEL[values.property_type].replace(" / Studio", "") : "Imóvel";
    let title = type;
    if (values.bedrooms > 0 && !NON_RESIDENTIAL.includes(values.property_type)) {
      title += ` de ${values.bedrooms} ${values.bedrooms === 1 ? "quarto" : "quartos"}`;
      if (values.suites > 0) title += values.suites === 1 ? " com suíte" : ` com ${values.suites} suítes`;
    } else if (values.usable_area) {
      title += ` de ${String(values.usable_area).replace(".", ",")} m²`;
    }
    if (values.neighborhood) title += ` — ${values.neighborhood}`;
    set("title", title);
  }

  function focusFirstError() {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]');
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    });
  }

  function buildPayload() {
    return {
      id: getId(),
      ...values,
      images: photos
        .filter((p) => p.status === "done" && p.storage_path)
        .map((p, position) => ({
          id: p.id,
          storage_path: p.storage_path!,
          position,
          is_cover: p.id === effectiveCover,
          width: p.width,
          height: p.height,
        })),
    };
  }

  function save() {
    setMessage(null);
    if (uploading) {
      setMessage({ tone: "error", text: "Aguarde o envio das fotos terminar para salvar." });
      return;
    }
    if (photos.some((p) => p.status === "error")) {
      setMessage({ tone: "error", text: "Algumas fotos não foram enviadas. Tente de novo ou remova essas fotos." });
      return;
    }

    const payload = buildPayload();
    const check = propertySchema.safeParse(payload);
    if (!check.success) {
      setErrors(toFieldErrors(check.error));
      setMessage({ tone: "error", text: "Faltam alguns dados. Confira os campos destacados em vermelho." });
      focusFirstError();
      return;
    }

    startTransition(async () => {
      const result = await saveProperty(payload);
      if (!result.ok) {
        setErrors(result.errors ?? {});
        setMessage({ tone: "error", text: result.message });
        focusFirstError();
        return;
      }
      const savedPhotos = photos.map((p) => ({ ...p, saved: true }));
      setPhotos(savedPhotos);
      setBaseline(snapshot(values, savedPhotos, coverId));
      setErrors({});
      setMeta({ code: result.code, slug: result.slug });

      if (result.created) {
        router.replace(`/admin/imoveis/editar?id=${result.id}&aviso=criado-${result.publish}`);
      } else {
        setMessage({ tone: "success", text: `Alterações salvas. ${PUBLISH_NOTE[result.publish]}` });
      }
    });
  }

  const deal = values.deal_type || null;
  const monthlyTotal =
    deal === "rent" && values.rent_price
      ? values.rent_price + (values.condo_fee ?? 0) + (values.iptu_exempt ? 0 : (values.iptu ?? 0))
      : null;
  const extraAmenities = values.amenities.filter((a) => !(AMENITIES as readonly string[]).includes(a));

  const saveButton = (
    <button type="button" onClick={save} disabled={pending || uploading} className={`${buttonPrimary} w-full py-3 text-base`}>
      {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Save className="size-5" aria-hidden />}
      {pending ? "Salvando…" : uploading ? "Enviando fotos…" : isNew ? "Cadastrar imóvel" : "Salvar alterações"}
    </button>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      noValidate
      className="pb-24 lg:pb-0"
    >
      {message && (
        <div className="mb-6">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {/* 1. Negócio */}
          <Section title="Tipo de negócio" description="Escolha primeiro: os campos de valor mudam conforme a opção.">
            <div
              role="radiogroup"
              aria-label="Tipo de negócio"
              data-invalid={errors.deal_type ? true : undefined}
              tabIndex={-1}
              className="grid grid-cols-2 gap-3 outline-none"
            >
              {(["rent", "sale"] as const).map((option) => {
                const Icon = option === "rent" ? KeyRound : Building2;
                const selected = values.deal_type === option;
                return (
                  <label
                    key={option}
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 px-3 py-5 text-center transition has-focus-visible:ring-2 has-focus-visible:ring-marinho-700 ${
                      selected
                        ? option === "rent"
                          ? "border-marinho-700 bg-marinho-50 text-marinho-700"
                          : "border-vermelho-600 bg-vermelho-50 text-vermelho-700"
                        : "border-areia-300 text-grafite-700 hover:border-grafite-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="deal_type"
                      value={option}
                      checked={selected}
                      onChange={() => setDeal(option)}
                      className="sr-only"
                    />
                    <Icon className="size-7" aria-hidden />
                    <span className="text-base font-semibold">{DEAL_LABEL[option]}</span>
                  </label>
                );
              })}
            </div>
            {errors.deal_type && <p className="mt-2 text-sm text-vermelho-700">{errors.deal_type}</p>}
          </Section>

          {/* 2. Valores */}
          <Section title="Valores" description="Condomínio e IPTU são opcionais e mensais.">
            {!deal ? (
              <p className="rounded-lg bg-areia-100 px-4 py-3 text-sm text-grafite-600">
                Escolha <strong>Aluguel</strong> ou <strong>Venda</strong> acima para preencher os valores.
              </p>
            ) : (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  {deal === "rent" ? (
                    <Field label="Aluguel por mês" htmlFor="rent_price" required error={errors.rent_price}>
                      <CurrencyInput id="rent_price" value={values.rent_price} onChange={(v) => set("rent_price", v)} invalid={!!errors.rent_price} />
                    </Field>
                  ) : (
                    <Field label="Valor de venda" htmlFor="sale_price" required error={errors.sale_price}>
                      <CurrencyInput id="sale_price" value={values.sale_price} onChange={(v) => set("sale_price", v)} invalid={!!errors.sale_price} />
                    </Field>
                  )}
                  <Field label="Condomínio" htmlFor="condo_fee" error={errors.condo_fee}>
                    <CurrencyInput id="condo_fee" value={values.condo_fee} onChange={(v) => set("condo_fee", v)} invalid={!!errors.condo_fee} />
                  </Field>
                  <Field label="IPTU por mês" htmlFor="iptu" error={errors.iptu}>
                    {values.iptu_exempt ? (
                      <div className={`${inputClass} bg-areia-100 text-grafite-600`}>Isento</div>
                    ) : (
                      <CurrencyInput id="iptu" value={values.iptu} onChange={(v) => set("iptu", v)} invalid={!!errors.iptu} />
                    )}
                  </Field>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <Checkbox id="iptu_exempt" label="IPTU isento" checked={values.iptu_exempt} onChange={(v) => set("iptu_exempt", v)} />
                  <Checkbox id="accepts_proposal" label="Aceita proposta" checked={values.accepts_proposal} onChange={(v) => set("accepts_proposal", v)} />
                </div>

                {monthlyTotal != null && (
                  <div className="flex items-center justify-between rounded-lg bg-marinho-50 px-4 py-3">
                    <span className="text-sm font-medium text-marinho-950">Total mensal no site</span>
                    <span className="font-serif text-xl text-marinho-700 tabular-nums lining-nums">{formatBRLCents(monthlyTotal)}</span>
                  </div>
                )}

                <Field
                  label="Observações sobre valores"
                  htmlFor="price_notes"
                  hint='Opcional. Ex.: "Taxa de água à parte", "Consumo de luz individualizado".'
                  error={errors.price_notes}
                >
                  <input id="price_notes" className={inputClass} value={values.price_notes} onChange={(e) => set("price_notes", e.target.value)} maxLength={500} />
                </Field>
              </div>
            )}
          </Section>

          {/* 3. Sobre o imóvel */}
          <Section title="Sobre o imóvel">
            <div className="space-y-4">
              <Field label="Tipo do imóvel" htmlFor="property_type" required error={errors.property_type}>
                <select
                  id="property_type"
                  className={inputClass}
                  value={values.property_type}
                  onChange={(e) => set("property_type", e.target.value as PropertyFormValues["property_type"])}
                  aria-invalid={errors.property_type ? true : undefined}
                >
                  <option value="" disabled>
                    Selecione…
                  </option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {PROPERTY_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Título do anúncio"
                htmlFor="title"
                required
                error={errors.title}
                hint={`Aparece no site e no WhatsApp. ${values.title.length}/140`}
              >
                <div className="flex gap-2">
                  <input
                    id="title"
                    className={inputClass}
                    value={values.title}
                    maxLength={140}
                    placeholder="Ex.: Apartamento de 2 quartos com varanda — Jardim Guanabara"
                    onChange={(e) => set("title", e.target.value)}
                    aria-invalid={errors.title ? true : undefined}
                  />
                  <button
                    type="button"
                    onClick={suggestTitle}
                    title="Sugerir um título com o tipo, os quartos e o bairro"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-areia-300 px-3 text-sm font-medium text-marinho-700 hover:border-marinho-700"
                  >
                    <Sparkles className="size-4" aria-hidden />
                    <span className="hidden sm:inline">Sugerir</span>
                  </button>
                </div>
              </Field>
            </div>
          </Section>

          {/* 4. Endereço */}
          <Section title="Endereço" description="Digite o CEP para preencher a rua, o bairro e a cidade automaticamente.">
            <div className="grid gap-4 sm:grid-cols-6">
              <Field
                label="CEP"
                htmlFor="zip_code"
                className="sm:col-span-2"
                error={errors.zip_code}
                hint={
                  cepStatus === "loading"
                    ? "Buscando endereço…"
                    : cepStatus === "notfound"
                      ? "CEP não encontrado. Preencha o endereço manualmente."
                      : cepStatus === "error"
                        ? "Não foi possível buscar o CEP agora."
                        : undefined
                }
              >
                <input
                  id="zip_code"
                  className={inputClass}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="00000-000"
                  value={values.zip_code}
                  onChange={(e) => {
                    const cep = formatCep(e.target.value);
                    set("zip_code", cep);
                    if (onlyDigits(cep).length === 8) lookupCep(cep);
                  }}
                  aria-invalid={errors.zip_code ? true : undefined}
                />
              </Field>
              <Field label="Rua" htmlFor="street" className="sm:col-span-4" error={errors.street}>
                <input id="street" className={inputClass} value={values.street} onChange={(e) => set("street", e.target.value)} />
              </Field>
              <Field label="Número" htmlFor="number" className="sm:col-span-2" error={errors.number}>
                <input id="number" className={inputClass} value={values.number} onChange={(e) => set("number", e.target.value)} />
              </Field>
              <Field label="Complemento" htmlFor="complement" className="sm:col-span-4" hint="Ex.: Apto 105, Bloco 2" error={errors.complement}>
                <input id="complement" className={inputClass} value={values.complement} onChange={(e) => set("complement", e.target.value)} />
              </Field>
              <Field label="Bairro" htmlFor="neighborhood" required className="sm:col-span-3" error={errors.neighborhood}>
                <input
                  id="neighborhood"
                  list="bairros-cadastrados"
                  className={inputClass}
                  value={values.neighborhood}
                  onChange={(e) => set("neighborhood", e.target.value)}
                  aria-invalid={errors.neighborhood ? true : undefined}
                />
                <datalist id="bairros-cadastrados">
                  {neighborhoods.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </Field>
              <Field label="Cidade" htmlFor="city" required className="sm:col-span-2" error={errors.city}>
                <input
                  id="city"
                  className={inputClass}
                  value={values.city}
                  onChange={(e) => set("city", e.target.value)}
                  aria-invalid={errors.city ? true : undefined}
                />
              </Field>
              <Field label="UF" htmlFor="state" required error={errors.state}>
                <input
                  id="state"
                  className={`${inputClass} uppercase`}
                  maxLength={2}
                  value={values.state}
                  onChange={(e) => set("state", e.target.value.toUpperCase())}
                  aria-invalid={errors.state ? true : undefined}
                />
              </Field>
            </div>
            <div className="mt-4 border-t border-areia-200 pt-2">
              <Toggle
                id="hide_number"
                label="Ocultar o número no site"
                description="O site mostra só a rua e o bairro, e o mapa fica aproximado."
                checked={values.hide_number}
                onChange={(v) => set("hide_number", v)}
              />
            </div>
          </Section>

          {/* 5. Características */}
          <Section title="Características">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
              <NumberStepper id="bedrooms" label="Quartos" value={values.bedrooms} onChange={(v) => set("bedrooms", v)} error={errors.bedrooms} />
              <NumberStepper id="suites" label="Suítes" value={values.suites} onChange={(v) => set("suites", v)} error={errors.suites} />
              <NumberStepper id="bathrooms" label="Banheiros" value={values.bathrooms} onChange={(v) => set("bathrooms", v)} error={errors.bathrooms} />
              <NumberStepper id="parking_spots" label="Vagas" value={values.parking_spots} onChange={(v) => set("parking_spots", v)} error={errors.parking_spots} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:max-w-md">
              <Field label="Área útil" htmlFor="usable_area" error={errors.usable_area}>
                <DecimalInput id="usable_area" suffix="m²" value={values.usable_area} onChange={(v) => set("usable_area", v)} invalid={!!errors.usable_area} />
              </Field>
              <Field label="Área total" htmlFor="total_area" error={errors.total_area}>
                <DecimalInput id="total_area" suffix="m²" value={values.total_area} onChange={(v) => set("total_area", v)} invalid={!!errors.total_area} />
              </Field>
            </div>
          </Section>

          {/* 6. Comodidades */}
          <Section title="Comodidades">
            <fieldset>
              <legend className="sr-only">Comodidades</legend>
              <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                {[...AMENITIES, ...extraAmenities].map((amenity) => (
                  <Checkbox
                    key={amenity}
                    id={`amenity-${amenity}`}
                    label={amenity}
                    checked={values.amenities.includes(amenity)}
                    onChange={(checked) =>
                      set(
                        "amenities",
                        checked ? [...values.amenities, amenity] : values.amenities.filter((a) => a !== amenity),
                      )
                    }
                  />
                ))}
              </div>
            </fieldset>
          </Section>

          {/* 7. Descrição */}
          <Section title="Descrição" description="Conte os detalhes do imóvel. Use negrito e listas para destacar o principal.">
            <RichTextEditor id="description" value={values.description} onChange={(html) => set("description", html)} />
            {errors.description && <p className="mt-2 text-sm text-vermelho-700">{errors.description}</p>}
          </Section>

          {/* 8. Fotos */}
          <Section id="fotos" title="Fotos" description="A primeira impressão do anúncio. Capriche na foto de capa.">
            <PhotoManager
              getPropertyId={getId}
              photos={photos}
              setPhotos={setPhotos}
              coverId={coverId}
              setCoverId={setCoverId}
              error={errors.images}
            />
          </Section>
        </div>

        {/* Publicação */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Section title="Publicação">
            <div className="space-y-4">
              {meta.code && (
                <div className="rounded-lg bg-areia-100 px-3 py-2 text-sm">
                  <span className="text-grafite-600">Código </span>
                  <strong className="tracking-wide text-marinho-950">{meta.code}</strong>
                </div>
              )}
              <Field label="Situação" htmlFor="status" error={errors.status}>
                <select
                  id="status"
                  className={inputClass}
                  value={values.status}
                  onChange={(e) => set("status", e.target.value as PropertyFormValues["status"])}
                  aria-invalid={errors.status ? true : undefined}
                >
                  {(deal ? STATUS_BY_DEAL[deal] : STATUS_BY_DEAL.rent).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="divide-y divide-areia-200">
                <Toggle
                  id="visible"
                  label="Mostrar no site"
                  description="Desligado, o imóvel fica só no painel."
                  checked={values.visible}
                  onChange={(v) => set("visible", v)}
                />
                <Toggle
                  id="featured"
                  label="Destaque na página inicial"
                  checked={values.featured}
                  onChange={(v) => set("featured", v)}
                />
              </div>
              <div className="hidden lg:block">{saveButton}</div>
              {dirty && !pending && <p className="hidden text-center text-xs text-grafite-600 lg:block">Há alterações não salvas.</p>}
              {meta.slug && (
                <Link
                  href={`/imovel/${meta.slug}`}
                  target="_blank"
                  className="flex items-center justify-center gap-1.5 text-sm font-medium text-marinho-700 hover:underline"
                >
                  Ver no site <ExternalLink className="size-3.5" aria-hidden />
                </Link>
              )}
            </div>
          </Section>

          {!isNew && initial.id && (
            <div className="text-center">
              <DeletePropertyButton
                id={initial.id}
                title={values.title}
                onDeleted={() => router.replace("/admin/imoveis?aviso=excluido")}
              />
            </div>
          )}
        </aside>
      </div>

      {/* Barra fixa de salvar no celular */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-areia-300 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        {dirty && !pending && <p className="mb-1.5 text-center text-xs text-grafite-600">Há alterações não salvas.</p>}
        {saveButton}
      </div>
    </form>
  );
}

function Checkbox({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-md py-2 text-sm text-grafite-900">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 shrink-0 rounded border-areia-300 accent-marinho-700"
      />
      {label}
    </label>
  );
}
