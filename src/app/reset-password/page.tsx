"use client";

// ---------------------------------------------------------------------------
// The /reset-password route — the reset link's landing. The reference's own
// page is the base44 PLATFORM template (V12/F4, live-measured): a plain
// WHITE page (not the app card's slate gradient), a rounded-lg solid-white
// card with shadow-lg + a 2px gray-900 strip at its top edge, the GRAY
// palette (gray-600 subtext, gray-50/50 inputs with the gray focus family
// and lucide-lock gray-400 icons), the "Set new password" H2 at 24px, the
// New Password + Confirm New Password pair at h-11, the "Must be at least
// 8 characters" helper, the h-11 bg-gray-900 "Reset password" submit, and
// the w-full gray-600 "Back to login".
//
// The token rides the query (?token=…): present → the form (validity is
// checked on submit — the reference's own page renders the form for any
// token string); absent or rejected → the reference's "Invalid Reset Link"
// state (the 80px bg-red-100 circle). This is the clone's reset form — the
// in-card token screen retired in V12 (the sent screen's in-app link lands
// here, exactly like the reference's email link would).
// ---------------------------------------------------------------------------
import * as React from "react";
import { Lock, CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiSend, ApiError } from "@/lib/api";

function ResetForm() {
  const [token, setToken] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [invalid, setInvalid] = React.useState(false);

  React.useEffect(() => {
    // Deferred one tick: the token rides the URL, and the read must not
    // setState synchronously inside the effect (react-hooks rule).
    const id = window.setTimeout(() => {
      const fromUrl = new URLSearchParams(window.location.search).get("token");
      if (fromUrl) setToken(fromUrl);
      else setInvalid(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    // The reference's client gates: the 8-char minimum + the confirm match
    // (its helper text is the standing hint; the errors surface in the
    // alert family).
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await apiSend("POST", "/api/auth/reset-password", { token, password });
      // Back to the login surface — the new password is live.
      window.location.replace("/login");
    } catch (err: unknown) {
      // An expired/unknown one-shot token renders the reference's invalid
      // state ("invalid or has expired").
      if (err instanceof ApiError && err.status === 404) setInvalid(true);
      else
        setError(
          err instanceof ApiError ? err.message : "Could not reset the password.",
        );
      setBusy(false);
    }
  };

  if (invalid) {
    return (
      <main
        // The platform page paints WHITE (its body is white — NOT the app
        // card's slate gradient; the app auth-page gradient stays off).
        className="flex min-h-dvh items-center justify-center bg-white p-4"
        // The platform page's ring-offset renders WHITE (its own root token
        // is white) — scope the app token like the AuthShell does.
        style={{ "--background": "255 255 255" } as React.CSSProperties}
      >
        <div className="relative w-full max-w-md overflow-hidden rounded-lg border-0 bg-white shadow-lg">
          <div
            aria-hidden
            className="absolute top-0 left-0 right-0 h-0.5 bg-gray-900"
          />
          <div className="flex flex-col items-center p-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <CircleAlert className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-gray-600">
              This password reset link is invalid or has expired.
            </p>
            <a
              href="/login"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-gray-800"
            >
              Back to Login
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex min-h-dvh items-center justify-center bg-white p-4"
      style={{ "--background": "255 255 255" } as React.CSSProperties}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-lg border-0 bg-white shadow-lg">
        {/* The platform card's 2px gray-900 top strip (V12/F4). */}
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-0.5 bg-gray-900"
        />
        <div className="flex flex-col items-center p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Set new password</h2>
          <p className="mt-2 text-gray-600">Enter your new password for VeloxPOS</p>
          <form onSubmit={submit} className="mt-8 w-full space-y-6">
            <div>
              <label
                htmlFor="rp-password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-gray-400" />
                </span>
                <Input
                  id="rp-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 rounded-xl border-gray-200 bg-gray-50/50 pl-10 text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-400 focus:ring-2 focus:ring-offset-2 focus-visible:outline-none md:text-sm"
                />
              </div>
              <p className="mt-2 text-left text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>
            <div>
              <label
                htmlFor="rp-confirm"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-gray-400" />
                </span>
                <Input
                  id="rp-confirm"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 rounded-xl border-gray-200 bg-gray-50/50 pl-10 text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-400 focus:ring-2 focus:ring-offset-2 focus-visible:outline-none md:text-sm"
                />
              </div>
            </div>
            {error ? (
              <div
                role="alert"
                data-testid="auth-error"
                className="relative w-full rounded-xl border border-red-200 bg-red-50/70 p-4"
              >
                <div className="text-sm leading-relaxed text-red-700">{error}</div>
              </div>
            ) : null}
            <Button
              type="submit"
              disabled={busy}
              className="h-11 w-full rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-gray-800"
            >
              {busy ? "Resetting…" : "Reset password"}
            </Button>
            <a
              href="/login"
              className="block w-full text-sm text-gray-600 transition-colors hover:text-gray-700"
            >
              Back to login
            </a>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <ResetForm />;
}
