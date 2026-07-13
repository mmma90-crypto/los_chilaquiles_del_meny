"use client";

import { useActionState } from "react";
import { loginAction, loginWithPinAction } from "./actions";
import { siteConfig } from "@/config/site";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [pinState, pinFormAction, isPinPending] = useActionState(
    loginWithPinAction,
    null
  );

  return (
    <div className="max-w-sm w-full">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Panel de administracion
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {siteConfig.name} · Solo para uso interno
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Contrasena
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase">o</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form action={pinFormAction} className="space-y-4">
          <div>
            <label
              htmlFor="pin"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              PIN de invitado
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="PIN de un solo uso"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <p className="mt-2 text-xs text-gray-400">
              Acceso temporal de 1 hora. El PIN solo sirve una vez.
            </p>
          </div>

          {pinState?.error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg">
              {pinState.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPinPending}
            className="w-full py-3 bg-white text-indigo-600 font-medium rounded-full border border-indigo-200 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPinPending ? "Verificando PIN..." : "Entrar con PIN"}
          </button>
        </form>
      </div>
    </div>
  );
}
