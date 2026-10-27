"use client";

// ---------------------------------------------------------------------------
// The auth surface — the reference-measured LIGHT page (v4 re-probe): a
// bg-white/95 backdrop-blur card with shadow-2xl on a to-bottom-right
// slate-50→slate-100 gradient, the VeloxPOS logo PNG in a ring-4 white
// circle, "Welcome to VeloxPOS", the four social buttons (official brand
// marks), the OR divider, Email/Password, Sign in, Forgot password?, and
// "Need an account? Sign up".
//
// The social buttons are the reference's hosted-OAuth affordances; this
// self-hosted build has no OAuth apps configured, so they explain themselves
// honestly (the inline notice) instead of dead-ending.
// ---------------------------------------------------------------------------

import * as React from "react";
import { Lock, Mail, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiSend, ApiError } from "@/lib/api";
import { safeReturnTo } from "@/lib/router";

type Screen = "login" | "forgot" | "sent" | "reset";

export function LoginSurface() {
  const [screen, setScreen] = React.useState<Screen>("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [resetToken, setResetToken] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");

  const social = (provider: string) => {
    setNotice(
      `${provider} no está configurado en esta instalación. Usa tu email y contraseña.`,
    );
  };

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiSend("POST", "/api/auth/login", { email, password });
      // V8/F1: return to the deep-linked route the 401 gate came from
      // (/login?from_url=… — the reference's round-trip). safeReturnTo
      // fails closed to "/" for anything not same-origin.
      const fromUrl = new URLSearchParams(window.location.search).get("from_url");
      window.location.replace(safeReturnTo(fromUrl, window.location.origin));
      // Full reload — the shell boots fresh with the session cookie.
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión.");
      setBusy(false);
    }
  };

  const submitForgot = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await apiSend<{ ok: boolean; resetPath?: string }>(
        "POST",
        "/api/auth/forgot-password",
        { email },
      );
      setBusy(false);
      // No SMTP in a self-hosted install: the API returns the one-shot
      // reset path directly (documented delivery contract) — complete the
      // flow in place when it does.
      if (res?.resetPath) {
        const token = new URL(res.resetPath, window.location.origin).searchParams.get(
          "token",
        );
        if (token) {
          setResetToken(token);
          setScreen("reset");
          return;
        }
      }
      setScreen("sent");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo enviar el enlace.");
      setBusy(false);
    }
  };

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiSend("POST", "/api/auth/reset-password", {
        token: resetToken,
        password: newPassword,
      });
      setBusy(false);
      setNotice("Contraseña actualizada. Inicia sesión con la nueva.");
      setScreen("login");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo restablecer.");
      setBusy(false);
    }
  };

  if (screen === "forgot") {
    return (
      <AuthShell>
        <h2 className="text-xl font-bold text-slate-900">Recuperar contraseña</h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Te enviaremos un enlace de restablecimiento.
        </p>
        <form onSubmit={submitForgot} className="mt-5 w-full space-y-4">
          <AuthInput
            id="forgot-email"
            type="email"
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            icon={<Mail className="h-4 w-4 text-slate-400" />}
            required
          />
          <Button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-xl bg-slate-900 px-4 text-sm font-medium text-white outline-[3px] outline-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-solid focus-visible:outline-[3px] focus-visible:outline-white"
          >
            {busy ? "Enviando…" : "Enviar enlace"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setScreen("login")}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
        </button>
        {error ? <AuthError message={error} /> : null}
      </AuthShell>
    );
  }

  if (screen === "reset") {
    return (
      <AuthShell>
        <h2 className="text-xl font-bold text-slate-900">Nueva contraseña</h2>
        <form onSubmit={submitReset} className="mt-5 w-full space-y-4">
          <AuthInput
            id="reset-token"
            type="text"
            label="Código de restablecimiento"
            value={resetToken}
            onChange={(event) => setResetToken(event.target.value)}
            icon={<Lock className="h-4 w-4 text-slate-400" />}
            required
          />
          <AuthInput
            id="reset-password"
            type="password"
            label="Nueva contraseña"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4 text-slate-400" />}
            required
          />
          <Button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-xl bg-slate-900 px-4 text-sm font-medium text-white outline-[3px] outline-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-solid focus-visible:outline-[3px] focus-visible:outline-white"
          >
            {busy ? "Guardando…" : "Actualizar contraseña"}
          </Button>
        </form>
        {error ? <AuthError message={error} /> : null}
      </AuthShell>
    );
  }

  if (screen === "sent") {
    return (
      <AuthShell>
        <h2 className="text-xl font-bold text-slate-900">Revisa tu correo</h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Si {email} tiene una cuenta, encontrarás el enlace de
          restablecimiento ahí.
        </p>
        <button
          type="button"
          onClick={() => setScreen("login")}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {/* The reference's logo mark (v4 re-probe): the hosted PNG in a
          ring-4 white circle over a soft slate glow — the DOM ships an
          <img> inside a `group relative` wrapper. */}
      <div className="group relative mb-5">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 opacity-30 blur-xl transition-opacity duration-300 group-hover:opacity-40"
        />
        <div className="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-full shadow-lg ring-4 ring-white/50 transition-all duration-300 group-hover:shadow-xl sm:h-24 sm:w-24">
          <img
            src="/veloxpos-logo.png"
            alt="VeloxPOS"
            width={96}
            height={96}
            className="aspect-square h-full w-full object-cover"
          />
        </div>
      </div>
      <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900">
        Welcome to VeloxPOS
      </h1>
      <p className="mt-2 text-center text-slate-500">Sign in to continue</p>

      <div className="mt-6 w-full space-y-3">
        <SocialButton provider="Google" onUse={social} />
        <SocialButton provider="Microsoft" onUse={social} />
        <SocialButton provider="Facebook" onUse={social} />
        <SocialButton provider="Apple" onUse={social} />
      </div>

      <div className="my-6 flex w-full items-center gap-4" aria-hidden>
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium text-slate-400">OR</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={submitLogin} className="w-full space-y-4" data-testid="login-form">
        <AuthInput
          id="login-email"
          type="email"
          label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4 text-slate-400" />}
          autoComplete="email"
          required
        />
        <AuthInput
          id="login-password"
          type="password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4 text-slate-400" />}
          autoComplete="current-password"
          required
        />
        {error ? <AuthError message={error} /> : null}
        {notice ? (
          <p
            role="status"
            data-testid="social-notice"
            className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700"
          >
            {notice}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={busy}
          data-testid="login-submit"
          className="h-12 w-full rounded-xl bg-slate-900 px-4 text-sm font-medium text-white outline-[3px] outline-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-solid focus-visible:outline-[3px] focus-visible:outline-white"
        >
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setNotice("");
          setScreen("forgot");
        }}
        data-testid="forgot-password-link"
        className="mt-4 w-full text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        Forgot password?
      </button>

      <p className="mt-4 text-center text-sm text-slate-500">
        Need an account?{" "}
        <a href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Sign up
        </a>
      </p>
    </AuthShell>
  );
}

// ---- shared pieces -----------------------------------------------------------

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="vx-auth-page flex min-h-dvh items-center justify-center p-4"
      data-testid="auth-page"
      // V11/SD-39: the reference's auth routes swap --background to WHITE at
      // the root (its token reads 0 0% 100% — HSL in its own theme; ours is
      // the RGB-triplet convention, so white = 255 255 255). Scoping it here
      // makes ring-offset-background render WHITE on the light surface like
      // the reference, instead of the app's dark canvas.
      style={{ "--background": "255 255 255" } as React.CSSProperties}
    >
      <div className="relative w-full max-w-md rounded-2xl border-0 bg-white/95 p-8 shadow-2xl backdrop-blur-sm sm:p-10">
        <div className="flex flex-col items-center">{children}</div>
      </div>
    </main>
  );
}

// The official brand marks, extracted from the reference's live DOM (v4) —
// same viewBox, same paths, same fills.
function SocialGlyph({ provider }: { provider: string }) {
  const common = {
    className: "h-5 w-5 shrink-0",
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
  };
  if (provider === "Google") {
    return (
      <svg {...common}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    );
  }
  if (provider === "Microsoft") {
    return (
      <svg {...common}>
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#00A4EF" d="M13 1h10v10H13z" />
        <path fill="#7FBA00" d="M1 13h10v10H1z" />
        <path fill="#FFB900" d="M13 13h10v10H13z" />
      </svg>
    );
  }
  if (provider === "Facebook") {
    return (
      <svg {...common}>
        <path
          fill="#1877F2"
          d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path
        fill="#000000"
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      />
    </svg>
  );
}

function SocialButton({
  provider,
  onUse,
}: {
  provider: string;
  onUse: (provider: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onUse(provider)}
      data-testid={`social-${provider.toLowerCase()}`}
      className="vx-focus flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:shadow"
    >
      <SocialGlyph provider={provider} />
      Continue with {provider}
    </button>
  );
}

function AuthInput({
  id,
  label,
  icon,
  ...props
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-center text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {icon}
        </span>
        <Input
          id={id}
          {...props}
          className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-base text-slate-900 placeholder:text-slate-600 focus:border-slate-400 focus:ring-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-12"
        />
      </div>
    </div>
  );
}

function AuthError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      data-testid="auth-error"
      className="mt-4 w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
    >
      {message}
    </p>
  );
}
