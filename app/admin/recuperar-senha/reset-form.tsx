"use client";

import Link from "next/link";
import { useActionState } from "react";
import { buttonPrimary, inputClass, Notice } from "@/components/admin/ui";
import { requestPasswordReset, type ResetState } from "../actions";

export function ResetForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestPasswordReset, undefined);

  if (state?.ok) {
    return (
      <div className="space-y-5">
        <Notice tone="success">{state.message}</Notice>
        <Link href="/admin/login" className="block text-center text-sm font-medium text-marinho-700 hover:underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <p className="text-sm text-grafite-600">Informe o e-mail que você usa para entrar. Vamos mandar um link para criar uma senha nova.</p>
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-grafite-700">
          E-mail
        </label>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={state?.email} className={inputClass} />
      </div>
      <p role="alert" className="min-h-5 text-sm text-vermelho-700">
        {state && !state.ok ? state.message : null}
      </p>
      <button type="submit" disabled={pending} className={`${buttonPrimary} w-full py-3 text-base`}>
        {pending ? "Enviando…" : "Enviar link"}
      </button>
      <Link href="/admin/login" className="block text-center text-sm font-medium text-marinho-700 hover:underline">
        Voltar para o login
      </Link>
    </form>
  );
}
