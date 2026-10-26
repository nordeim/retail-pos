"use client";

// ---------------------------------------------------------------------------
// The auth surface — the reference-measured LIGHT page: white card on a soft
// gray-blue gradient, dark circular logo, "Welcome to VeloxPOS", the four
// social buttons, the OR divider, Email/Password, Sign in, Forgot password?,
// and "Need an account? Sign up".
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
      // Full reload — the shell boots fresh with the session cookie.
      window.location.replace("/");
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
            className="w-full bg-indigo-600 text-white hover:bg-indigo-600/90"
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
            className="w-full bg-indigo-600 text-white hover:bg-indigo-600/90"
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
      {/* The reference's dark circular logo badge (a violet cube glyph). */}
      <span
        aria-hidden
        className="mb-5 flex h-24 w-24 items-center justify-center rounded-full shadow-[0_10px_30px_rgba(30,27,75,0.25)]"
        style={{ background: "#221f45" }}
      >
        <svg viewBox="0 0 24 24" className="h-11 w-11" fill="none" stroke="url(#vx-cube)" strokeWidth="1.6" strokeLinejoin="round">
          <defs>
            <linearGradient id="vx-cube" x1="0" y1="0" x2="24" y2="24">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path d="M12 2.5 21 7v10l-9 4.5L3 17V7l9-4.5Z" />
          <path d="M3 7l9 4.5L21 7M12 11.5V21.5" />
          <path d="M7.5 4.75 16.5 9.25" />
        </svg>
      </span>
      <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900">
        Welcome to VeloxPOS
      </h1>
      <p className="mt-2 text-center text-slate-500">Sign in to continue</p>

      <div className="mt-6 w-full space-y-3">
        <SocialButton provider="Google" glyph="G" onUse={social} />
        <SocialButton provider="Microsoft" glyph="M" onUse={social} />
        <SocialButton provider="Facebook" glyph="f" onUse={social} />
        <SocialButton provider="Apple" glyph="" onUse={social} />
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
          className="w-full bg-indigo-600 text-white hover:bg-indigo-600/90"
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
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="flex flex-col items-center">{children}</div>
      </div>
    </main>
  );
}

function SocialButton({
  provider,
  glyph,
  onUse,
}: {
  provider: string;
  glyph: string;
  onUse: (provider: string) => void;
}) {
  const color =
    provider === "Google"
      ? "#4285F4"
      : provider === "Microsoft"
        ? "#00A4EF"
        : provider === "Facebook"
          ? "#1877F2"
          : "#111111";
  return (
    <button
      type="button"
      onClick={() => onUse(provider)}
      data-testid={`social-${provider.toLowerCase()}`}
      className="vx-focus flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
    >
      <span
        aria-hidden
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ background: color }}
      >
        {glyph}
      </span>
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
          className="h-11 rounded-xl border-slate-300 bg-white pl-9 text-slate-900 placeholder:text-slate-400"
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
