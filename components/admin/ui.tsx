import type { ReactNode } from "react";

export const inputClass =
  "block w-full rounded-lg border border-areia-300 bg-white px-3.5 py-2.5 text-base text-grafite-900 outline-none transition placeholder:text-grafite-600 focus:border-marinho-700 focus:ring-2 focus:ring-marinho-100 aria-[invalid=true]:border-vermelho-600 aria-[invalid=true]:ring-vermelho-50 disabled:bg-areia-100";

export const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-marinho-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-marinho-600 disabled:cursor-not-allowed disabled:opacity-60";

export const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-areia-300 bg-white px-4 py-2.5 text-sm font-semibold text-grafite-900 transition hover:border-marinho-700 hover:text-marinho-700 disabled:cursor-not-allowed disabled:opacity-60";

export function Section({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-xl border border-areia-300 bg-white p-5 sm:p-6">
      <header className="mb-5">
        <h2 className="font-serif text-xl text-marinho-950">{title}</h2>
        {description && <p className="mt-1 text-sm text-grafite-600">{description}</p>}
      </header>
      {children}
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-grafite-700">
        {label}
        {required && (
          <span className="text-vermelho-600" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-erro` : undefined} className="text-sm text-vermelho-700">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-grafite-600">{hint}</p>
      ) : null}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  id: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span>
        <span className="block text-sm font-medium text-grafite-900">{label}</span>
        {description && <span className="block text-xs text-grafite-600">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-areia-300 transition peer-checked:bg-marinho-700 peer-focus-visible:ring-2 peer-focus-visible:ring-marinho-700 peer-focus-visible:ring-offset-2" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "error"; children: ReactNode }) {
  const tones = {
    info: "border-marinho-100 bg-marinho-50 text-marinho-950",
    success: "border-green-200 bg-green-50 text-green-900",
    error: "border-vermelho-600/30 bg-vermelho-50 text-vermelho-700",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}
