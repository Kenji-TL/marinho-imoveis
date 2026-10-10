"use client";

import { Minus, Plus } from "lucide-react";

/** Contador com botões − e +, confortável de usar no celular */
export function NumberStepper({
  id,
  label,
  value,
  onChange,
  max = 99,
  error,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  error?: string;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(0, v)));
  const button =
    "flex size-10 items-center justify-center rounded-lg border border-areia-300 bg-white text-marinho-700 transition hover:border-marinho-700 disabled:opacity-40";

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-grafite-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button type="button" className={button} onClick={() => set(value - 1)} disabled={value <= 0} aria-label={`Diminuir ${label.toLowerCase()}`}>
          <Minus className="size-4" aria-hidden />
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => set(Number(e.target.value.replace(/\D/g, "") || 0))}
          aria-invalid={error ? true : undefined}
          className="h-10 w-14 rounded-lg border border-areia-300 text-center text-base font-semibold tabular-nums outline-none focus:border-marinho-700 focus:ring-2 focus:ring-marinho-100 aria-[invalid=true]:border-vermelho-600"
        />
        <button type="button" className={button} onClick={() => set(value + 1)} disabled={value >= max} aria-label={`Aumentar ${label.toLowerCase()}`}>
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
      {error && <p className="text-sm text-vermelho-700">{error}</p>}
    </div>
  );
}
