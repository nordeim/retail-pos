"use client";

// ---------------------------------------------------------------------------
// The /signup route — "Need an account? Sign up" lands here. The flow: name
// + email + password → the API returns the 6-digit verification code (the
// documented no-SMTP delivery: the OTP rides the response) → the verify step
// signs the new user in and lands on the Terminal.
// ---------------------------------------------------------------------------

import * as React from "react";
import { Lock, Mail, User } from "lucide-react";

import { AuthShell } from "@/components/auth/login-surface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiSend, ApiError } from "@/lib/api";

export function SignupSurface() {
  const [stage, setStage] = React.useState<"form" | "verify">("form");
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiSend<{ ok: boolean; code?: string }>("POST", "/api/auth/register", {
        fullName,
        email,
        password,
      });
      setStage("verify");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setBusy(false);
    }
  };

  const submitVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiSend("POST", "/api/auth/verify-email", { email, code });
      window.location.replace("/");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Código incorrecto.");
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      {stage === "form" ? (
            <>
              <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">
                Create your account
              </h1>
              <p className="mt-2 text-center text-sm text-slate-500">
                Start selling with VeloxPOS today.
              </p>
              <form onSubmit={submitForm} className="mt-6 w-full space-y-4">
                <TextField
                  id="signup-name"
                  label="Nombre"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Tu nombre"
                  icon={<User className="h-4 w-4 text-slate-400" />}
                />
                <TextField
                  id="signup-email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  icon={<Mail className="h-4 w-4 text-slate-400" />}
                  required
                />
                <TextField
                  id="signup-password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  icon={<Lock className="h-4 w-4 text-slate-400" />}
                  required
                />
                {error ? (
                  <p
                    role="alert"
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                  >
                    {error}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  disabled={busy}
                  className="h-12 w-full rounded-xl bg-slate-900 px-4 text-sm font-medium text-white outline-[3px] outline-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-solid focus-visible:outline-[3px] focus-visible:outline-white"
                >
                  {busy ? "Creating…" : "Sign up"}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <a href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                  Sign in
                </a>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">
                Verify your email
              </h1>
              <p className="mt-2 text-center text-sm text-slate-500">
                Introduce el código de 6 dígitos que enviamos a {email}. (Sin SMTP
                configurado, el código también aparece en la respuesta del registro.)
              </p>
              <form onSubmit={submitVerify} className="mt-6 w-full space-y-4">
                <TextField
                  id="signup-code"
                  label="Código"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                  icon={<Lock className="h-4 w-4 text-slate-400" />}
                  required
                />
                {error ? (
                  <p
                    role="alert"
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                  >
                    {error}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  disabled={busy}
                  className="h-12 w-full rounded-xl bg-slate-900 px-4 text-sm font-medium text-white outline-[3px] outline-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-solid focus-visible:outline-[3px] focus-visible:outline-white"
                >
                  {busy ? "Verifying…" : "Verify and sign in"}
                </Button>
              </form>
            </>
          )}
    </AuthShell>
  );
}

function TextField({
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
      <label htmlFor={id} className="mb-1.5 block text-center text-sm font-medium text-slate-700">
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
