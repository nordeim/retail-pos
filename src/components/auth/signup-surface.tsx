"use client";

// ---------------------------------------------------------------------------
// The /signup route — "Need an account? Sign up" lands here. The flow: name
// + email + password → the API returns the 6-digit verification code (the
// documented no-SMTP delivery: the OTP rides the response) → the verify step
// signs the new user in and lands on the Terminal.
//
// The surface rides the V12 auth grammar: the fixed AuthShell card, the
// responsive h-11 sm:h-12 submit, the shadcn-Alert error boxes, and the
// English label family (the reference's auth copy is English throughout —
// its /signup itself 404s, the documented SD-20 platform artifact, so the
// clone's public signup is the superset with the aligned chrome).
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
      setError(err instanceof ApiError ? err.message : "Could not create the account.");
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
      setError(err instanceof ApiError ? err.message : "That code is not correct.");
      setBusy(false);
    }
  };

  const submitClass =
    "h-11 w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 outline-[3px] outline-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-solid focus-visible:outline-[3px] focus-visible:outline-white sm:h-12";

  return (
    <AuthShell>
      {stage === "form" ? (
        <>
          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Create your account
            </h1>
            <p className="text-sm font-medium text-slate-500 sm:text-base">
              Start selling with VeloxPOS today.
            </p>
          </div>
          <div className="w-full">
            <form onSubmit={submitForm} className="space-y-4 sm:space-y-5">
              <div className="space-y-3 sm:space-y-4">
                <TextField
                  id="signup-name"
                  label="Full name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                  icon={<User className="h-4 w-4 text-slate-400" />}
                  required
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
                  placeholder="Minimum 8 characters"
                  icon={<Lock className="h-4 w-4 text-slate-400" />}
                  required
                />
                {error ? <FormError message={error} /> : null}
              </div>
              <div className="space-y-3">
                <Button type="submit" disabled={busy} className={submitClass}>
                  {busy ? "Creating…" : "Sign up"}
                </Button>
                <p className="text-center text-sm text-slate-500">
                  <a
                    href="/login"
                    className="transition-colors hover:text-slate-700"
                  >
                    Already have an account? Sign in
                  </a>
                </p>
              </div>
            </form>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Verify your email
            </h1>
            <p className="text-sm font-medium text-slate-500 sm:text-base">
              Enter the 6-digit code we sent to {email}.
            </p>
          </div>
          <div className="w-full">
            <form onSubmit={submitVerify} className="space-y-4 sm:space-y-5">
              <div className="space-y-3 sm:space-y-4">
                <TextField
                  id="signup-code"
                  label="Verification code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                  icon={<Lock className="h-4 w-4 text-slate-400" />}
                  required
                />
                {error ? <FormError message={error} /> : null}
              </div>
              <div className="space-y-3">
                <Button type="submit" disabled={busy} className={submitClass}>
                  {busy ? "Verifying…" : "Verify and sign in"}
                </Button>
              </div>
            </form>
          </div>
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

function FormError({ message }: { message: string }) {
  // The reference's shadcn Alert shape (V12/F5) — same family as the login
  // error and the sent screen's green note.
  return (
    <div
      role="alert"
      data-testid="auth-error"
      className="relative w-full rounded-xl border border-red-200 bg-red-50/70 p-4"
    >
      <div className="text-sm leading-relaxed text-red-700">{message}</div>
    </div>
  );
}
