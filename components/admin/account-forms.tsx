"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { changeMyPassword, updateMyName, type AccountState } from "@/lib/admin/api";
import { PASSWORD_MIN } from "@/lib/validation/team";
import { buttonPrimary, Field, inputClass, Notice, Section } from "./ui";

export function AccountForms({
  userId,
  name,
  email,
  roleLabel,
  onNameChanged,
}: {
  userId: string;
  name: string | null;
  email: string;
  roleLabel: string;
  onNameChanged: () => void;
}) {
  const [nameState, nameAction, namePending] = useActionState<AccountState, FormData>(async (_prev, formData) => {
    const result = await updateMyName(userId, formData);
    if (result?.ok) onNameChanged();
    return result;
  }, undefined);
  const [passState, passAction, passPending] = useActionState<AccountState, FormData>(
    (_prev, formData) => changeMyPassword(email, formData),
    undefined,
  );
  const passErrors = passState && !passState.ok ? passState.errors ?? {} : {};

  return (
    <div className="space-y-6">
      <Section title="Seus dados">
        <form action={nameAction} className="space-y-4" noValidate>
          {nameState && <Notice tone={nameState.ok ? "success" : "error"}>{nameState.message}</Notice>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" htmlFor="name" error={nameState && !nameState.ok ? nameState.errors?.name : undefined}>
              <input id="name" name="name" defaultValue={name ?? ""} autoComplete="name" className={inputClass} />
            </Field>
            <Field label="E-mail de acesso" htmlFor="email" hint={`Acesso: ${roleLabel}. Para trocar o e-mail, peça a um dono.`}>
              <input id="email" value={email} readOnly className={`${inputClass} bg-areia-100 text-grafite-600`} />
            </Field>
          </div>
          <button type="submit" className={buttonPrimary} disabled={namePending}>
            {namePending && <Loader2 className="size-4 animate-spin" aria-hidden />} Salvar nome
          </button>
        </form>
      </Section>

      <Section title="Trocar senha" description={`Use pelo menos ${PASSWORD_MIN} caracteres.`}>
        <form action={passAction} className="space-y-4" noValidate key={passState?.ok ? passState.at : "senha"}>
          {passState && <Notice tone={passState.ok ? "success" : "error"}>{passState.message}</Notice>}
          <Field label="Senha atual" htmlFor="current" error={passErrors.current}>
            <input id="current" name="current" type="password" autoComplete="current-password" className={`${inputClass} sm:max-w-sm`} aria-invalid={passErrors.current ? true : undefined} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nova senha" htmlFor="password" error={passErrors.password}>
              <input id="password" name="password" type="password" autoComplete="new-password" className={inputClass} aria-invalid={passErrors.password ? true : undefined} />
            </Field>
            <Field label="Repita a nova senha" htmlFor="confirm" error={passErrors.confirm}>
              <input id="confirm" name="confirm" type="password" autoComplete="new-password" className={inputClass} aria-invalid={passErrors.confirm ? true : undefined} />
            </Field>
          </div>
          <button type="submit" className={buttonPrimary} disabled={passPending}>
            {passPending && <Loader2 className="size-4 animate-spin" aria-hidden />} Trocar senha
          </button>
        </form>
      </Section>
    </div>
  );
}
