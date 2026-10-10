"use client";

import { useActionState } from "react";
import { buttonPrimary, Field, inputClass } from "@/components/admin/ui";
import { PASSWORD_MIN } from "@/lib/validation/team";
import { setNewPassword, type NewPasswordState } from "../actions";

export function NewPasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<NewPasswordState, FormData>(setNewPassword, undefined);
  const errors = state?.errors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <p className="text-sm text-grafite-600">
        Acesso de <strong className="text-grafite-900">{email}</strong>. Use pelo menos {PASSWORD_MIN} caracteres.
      </p>
      {/* Ajuda o gerenciador de senhas do navegador a salvar com o e-mail certo */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <Field label="Nova senha" htmlFor="password" error={errors.password}>
        <input id="password" name="password" type="password" autoComplete="new-password" className={inputClass} aria-invalid={errors.password ? true : undefined} />
      </Field>
      <Field label="Repita a senha" htmlFor="confirm" error={errors.confirm}>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" className={inputClass} aria-invalid={errors.confirm ? true : undefined} />
      </Field>
      {state?.message && !Object.keys(errors).length && (
        <p role="alert" className="text-sm text-vermelho-700">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${buttonPrimary} w-full py-3 text-base`}>
        {pending ? "Salvando…" : "Salvar senha e entrar"}
      </button>
    </form>
  );
}
