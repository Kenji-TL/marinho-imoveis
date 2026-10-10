const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlRounded = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** "R$ 2.200" quando o valor é inteiro, "R$ 754,83" quando tem centavos */
export function formatBRL(value: number): string {
  return Number.isInteger(value) ? brlRounded.format(value) : brl.format(value);
}

/** Sempre com centavos: "R$ 2.200,00" */
export function formatBRLCents(value: number): string {
  return brl.format(value);
}

/** "2.200,00" (sem o símbolo), usado nos campos com máscara */
export function formatMoneyInput(value: number): string {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function formatArea(value: number): string {
  return `${decimal.format(value)} m²`;
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** "21997801515" ou "2124631122" -> "(21) 99780-1515" / "(21) 2463-1122" */
export function formatPhone(value: string): string {
  const d = onlyDigits(value).replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Converte o que o usuário digitou em número de WhatsApp no formato do wa.me:
 * "(21) 99780-1515" -> "5521997801515". Retorna null se não for um número válido.
 */
export function normalizeWhatsapp(value: string): string | null {
  let d = onlyDigits(value);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return /^55\d{10,11}$/.test(d) ? d : null;
}

/** "21931370" -> "21931-370" */
export function formatCep(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export function formatDate(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** Mesma regra do slugify do banco: minúsculas, sem acento, separado por hífen */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
