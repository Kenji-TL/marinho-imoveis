"use client";

import { KeyRound, Loader2, Mail, Plus, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addMember, changeMemberRole, removeMember, sendAccessLink, type TeamResult } from "@/app/admin/(painel)/equipe/actions";
import type { TeamMember } from "@/lib/admin/queries";
import { formatDate } from "@/lib/format";
import { ConfirmDialog } from "./confirm-dialog";
import { buttonPrimary, buttonSecondary, Field, inputClass, Notice } from "./ui";

type Role = "dono" | "corretor";

const ROLE_INFO: Record<Role, { label: string; text: string }> = {
  dono: { label: "Dono", text: "Faz tudo: imóveis, configurações do site e equipe." },
  corretor: { label: "Corretor", text: "Cadastra e edita imóveis e fotos." },
};

function randomPassword() {
  // Sem caracteres parecidos (0/O, 1/l) para ditar sem confusão
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const values = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

const EMPTY = { name: "", email: "", role: "corretor" as Role, mode: "senha" as "senha" | "convite", password: "" };

export function TeamManager({ members, canManage, meId }: { members: TeamMember[]; canManage: boolean; meId: string }) {
  const router = useRouter();
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [toRemove, setToRemove] = useState<TeamMember | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (key: string, fn: () => Promise<TeamResult>, after?: (r: TeamResult) => void) => {
    setBusy(key);
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      setBusy(null);
      setMessage({ tone: result.ok ? "success" : "error", text: result.message });
      after?.(result);
      if (result.ok) router.refresh();
    });
  };

  const owners = members.filter((m) => m.role === "dono").length;

  function setField<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    if (message?.tone === "error") setMessage(null);
  }

  return (
    <div className="space-y-6">
      {!canManage && (
        <Notice tone="error">
          Para adicionar e remover pessoas, falta cadastrar a chave secreta do Supabase no servidor
          (<code>SUPABASE_SECRET_KEY</code>). O passo a passo está no README, em “Equipe do painel”.
        </Notice>
      )}
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      {!form ? (
        <button
          type="button"
          className={buttonPrimary}
          disabled={!canManage}
          onClick={() => {
            setErrors({});
            setMessage(null);
            setForm({ ...EMPTY, password: randomPassword() });
          }}
        >
          <UserPlus className="size-4" aria-hidden /> Adicionar pessoa
        </button>
      ) : (
        <form
          className="space-y-5 rounded-xl border border-marinho-100 bg-white p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            run("add", () => addMember(form), (r) => {
              if (r.ok) setForm(null);
              else setErrors(r.errors ?? {});
            });
          }}
          noValidate
        >
          <h2 className="font-serif text-xl text-marinho-950">Adicionar pessoa</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" htmlFor="m-name" required error={errors.name}>
              <input id="m-name" className={inputClass} value={form.name} autoComplete="off" onChange={(e) => setField("name", e.target.value)} aria-invalid={errors.name ? true : undefined} />
            </Field>
            <Field label="E-mail" htmlFor="m-email" required error={errors.email}>
              <input id="m-email" type="email" inputMode="email" autoComplete="off" className={inputClass} value={form.email} onChange={(e) => setField("email", e.target.value)} aria-invalid={errors.email ? true : undefined} />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-grafite-700">Acesso</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(ROLE_INFO) as Role[]).map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition has-focus-visible:ring-2 has-focus-visible:ring-marinho-700 ${
                    form.role === r ? "border-marinho-700 bg-marinho-50" : "border-areia-300 hover:border-grafite-600"
                  }`}
                >
                  <input type="radio" name="role" value={r} checked={form.role === r} onChange={() => setField("role", r)} className="mt-1 size-4 accent-marinho-700" />
                  <span>
                    <span className="block font-semibold text-grafite-900">{ROLE_INFO[r].label}</span>
                    <span className="block text-sm text-grafite-600">{ROLE_INFO[r].text}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-grafite-700">Como a pessoa vai entrar</legend>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-areia-100">
                <input type="radio" name="mode" checked={form.mode === "senha"} onChange={() => setField("mode", "senha")} className="mt-1 size-4 accent-marinho-700" />
                <span>
                  <span className="block text-sm font-semibold text-grafite-900">Com uma senha provisória</span>
                  <span className="block text-sm text-grafite-600">Você passa o e-mail e a senha para a pessoa. Funciona sempre.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-areia-100">
                <input type="radio" name="mode" checked={form.mode === "convite"} onChange={() => setField("mode", "convite")} className="mt-1 size-4 accent-marinho-700" />
                <span>
                  <span className="block text-sm font-semibold text-grafite-900">Por convite no e-mail</span>
                  <span className="block text-sm text-grafite-600">A pessoa recebe um link para criar a própria senha.</span>
                </span>
              </label>
            </div>
          </fieldset>

          {form.mode === "senha" && (
            <Field label="Senha provisória" htmlFor="m-password" required error={errors.password} hint="Anote e passe para a pessoa. Ela pode trocar depois em “Minha conta”.">
              <div className="flex gap-2">
                <input id="m-password" className={`${inputClass} font-mono tracking-wide`} value={form.password} onChange={(e) => setField("password", e.target.value)} aria-invalid={errors.password ? true : undefined} autoComplete="new-password" />
                <button type="button" className={buttonSecondary} onClick={() => setField("password", randomPassword())} title="Gerar outra senha">
                  <RefreshCw className="size-4" aria-hidden /> <span className="hidden sm:inline">Gerar</span>
                </button>
              </div>
            </Field>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={buttonSecondary} onClick={() => setForm(null)} disabled={pending}>
              Cancelar
            </button>
            <button type="submit" className={buttonPrimary} disabled={pending}>
              {busy === "add" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              {form.mode === "convite" ? "Enviar convite" : "Adicionar"}
            </button>
          </div>
        </form>
      )}

      <ul className="divide-y divide-areia-200 rounded-xl border border-areia-300 bg-white">
        {members.map((m) => {
          const isMe = m.user_id === meId;
          const lastOwner = m.role === "dono" && owners <= 1;
          return (
            <li key={m.user_id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-grafite-900">
                  {m.name || m.email}
                  {isMe && <span className="rounded bg-areia-200 px-1.5 py-0.5 text-xs font-medium text-grafite-700">você</span>}
                  {m.status === "convite-pendente" && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">convite pendente</span>
                  )}
                </p>
                <p className="truncate text-sm text-grafite-600">{m.email}</p>
                {m.last_sign_in_at && <p className="text-xs text-grafite-600">Último acesso em {formatDate(m.last_sign_in_at)}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={`role-${m.user_id}`}>Acesso de {m.name || m.email}</label>
                <select
                  id={`role-${m.user_id}`}
                  value={m.role}
                  disabled={pending || lastOwner}
                  title={lastOwner ? "É preciso ter pelo menos um dono" : undefined}
                  onChange={(e) => run(`role-${m.user_id}`, () => changeMemberRole(m.user_id, e.target.value as Role))}
                  className="h-10 rounded-lg border border-areia-300 bg-white px-3 text-sm text-grafite-900 outline-none focus:border-marinho-700 focus:ring-2 focus:ring-marinho-100 disabled:bg-areia-100 disabled:text-grafite-600"
                >
                  <option value="dono">Dono</option>
                  <option value="corretor">Corretor</option>
                </select>
                <button
                  type="button"
                  className={buttonSecondary}
                  disabled={pending}
                  onClick={() => run(`link-${m.user_id}`, () => sendAccessLink(m.user_id))}
                  title="Envia por e-mail um link para a pessoa criar uma senha nova"
                >
                  {busy === `link-${m.user_id}` ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Mail className="size-4" aria-hidden />}
                  <span>Enviar link de senha</span>
                </button>
                {!isMe && (
                  <button
                    type="button"
                    onClick={() => setToRemove(m)}
                    disabled={pending || !canManage || lastOwner}
                    aria-label={`Remover ${m.name || m.email}`}
                    className="flex size-10 items-center justify-center rounded-lg text-vermelho-700 hover:bg-vermelho-50 disabled:opacity-40"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="flex items-start gap-2 text-sm text-grafite-600">
        <KeyRound className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <strong className="text-grafite-700">Dono</strong>: {ROLE_INFO.dono.text} <strong className="text-grafite-700">Corretor</strong>:{" "}
          {ROLE_INFO.corretor.text}
        </span>
      </p>

      <ConfirmDialog
        open={!!toRemove}
        title="Remover da equipe?"
        confirmLabel="Remover"
        pending={pending}
        onCancel={() => setToRemove(null)}
        onConfirm={() => {
          const target = toRemove;
          setToRemove(null);
          if (target) run(`remove-${target.user_id}`, () => removeMember(target.user_id));
        }}
      >
        <p>
          <strong>{toRemove?.name || toRemove?.email}</strong> perde o acesso ao painel na hora. Os imóveis que essa
          pessoa cadastrou continuam no site.
        </p>
      </ConfirmDialog>
    </div>
  );
}
