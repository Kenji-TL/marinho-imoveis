"use client";

import { formatMoneyInput, onlyDigits } from "@/lib/format";
import { inputClass } from "./ui";

/**
 * Campo de valor em reais. O usuário digita só números e os centavos
 * se ajustam sozinhos: 2 2 0 0 0 0 -> "2.200,00".
 */
export function CurrencyInput({
  id,
  value,
  onChange,
  invalid,
  placeholder = "0,00",
}: {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
  invalid?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-grafite-600">
        R$
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={value == null ? "" : formatMoneyInput(value)}
        onChange={(e) => {
          const digits = onlyDigits(e.target.value).slice(0, 12);
          onChange(digits ? Number(digits) / 100 : null);
        }}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-erro` : undefined}
        className={`${inputClass} pl-10 text-right tabular-nums`}
      />
    </div>
  );
}

/** Campo de número com vírgula (áreas em m²) */
export function DecimalInput({
  id,
  value,
  onChange,
  suffix,
  invalid,
}: {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
  suffix?: string;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        defaultValue={value == null ? "" : String(value).replace(".", ",")}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d,]/g, "").replace(/,(?=.*,)/g, "");
          const parsed = raw ? Number(raw.replace(",", ".")) : null;
          onChange(parsed != null && Number.isFinite(parsed) ? parsed : null);
        }}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-erro` : undefined}
        className={`${inputClass} ${suffix ? "pr-12" : ""} tabular-nums`}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-grafite-600">
          {suffix}
        </span>
      )}
    </div>
  );
}
