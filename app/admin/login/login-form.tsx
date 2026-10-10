"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, type LoginState } from "../actions";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const error = state?.error ?? initialError;

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-grafite-700">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={state?.email}
          className="block w-full rounded-lg border border-areia-300 bg-white px-3.5 py-3 text-base text-grafite-900 outline-none transition focus:border-marinho-700 focus:ring-2 focus:ring-marinho-100"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-grafite-700">
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="block w-full rounded-lg border border-areia-300 bg-white py-3 pr-20 pl-3.5 text-base text-grafite-900 outline-none transition focus:border-marinho-700 focus:ring-2 focus:ring-marinho-100"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 px-3.5 text-sm font-medium text-marinho-700 hover:text-marinho-600"
            aria-pressed={showPassword}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      <p role="alert" aria-live="polite" className="min-h-5 text-sm text-vermelho-700">
        {error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-marinho-700 px-4 py-3 text-base font-semibold text-white transition hover:bg-marinho-600 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <Link href="/admin/recuperar-senha" className="block text-center text-sm font-medium text-marinho-700 hover:underline">
        Esqueci minha senha
      </Link>
    </form>
  );
}
