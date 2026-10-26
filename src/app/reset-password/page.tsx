"use client";

// The /reset-password route — the reset link's landing. The token rides the
// query (?token=…); the surface is the same light auth card with the two
// fields (token + new password). The actual reset POST is the LoginSurface's
// "reset" screen logic; here it reads the token from the URL instead.
import * as React from "react";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiSend, ApiError } from "@/lib/api";

function ResetForm() {
  const [token, setToken] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    // Deferred one tick: the token rides the URL, and the read must not
    // setState synchronously inside the effect (react-hooks rule).
    const id = window.setTimeout(() => {
      const fromUrl = new URLSearchParams(window.location.search).get("token");
      if (fromUrl) setToken(fromUrl);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiSend("POST", "/api/auth/reset-password", { token, password });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo restablecer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="vx-auth-page flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-10">
        {done ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-xl font-bold text-slate-900">Contraseña actualizada</h1>
            <p className="text-sm text-slate-500">Ya puedes iniciar sesión.</p>
            <a
              href="/login"
              className="mt-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600/90"
            >
              Ir a iniciar sesión
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <h1 className="text-center text-xl font-bold text-slate-900">
              Restablecer contraseña
            </h1>
            <div>
              <label htmlFor="rp-token" className="mb-1.5 block text-center text-sm font-medium text-slate-700">
                Código
              </label>
              <Input
                id="rp-token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
                className="h-11 rounded-xl border-slate-300 bg-white text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="rp-password" className="mb-1.5 block text-center text-sm font-medium text-slate-700">
                Nueva contraseña
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-slate-400" />
                </span>
                <Input
                  id="rp-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-11 rounded-xl border-slate-300 bg-white pl-9 text-slate-900"
                />
              </div>
            </div>
            {error ? (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-600/90"
            >
              {busy ? "Guardando…" : "Actualizar contraseña"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <ResetForm />;
}
