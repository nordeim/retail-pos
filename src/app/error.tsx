"use client";

// The route-segment error net (V18/F1, SD-70 — the neo-crm session-170
// pattern adapted to this app). An uncaught error in ANY page below the
// root layout unwinds here: the root layout (html/body/toaster) stays
// alive around this card. The view-level boundary in page.tsx catches
// view/chunk failures FIRST and keeps the shell alive — this net is for
// NON-view crashes (a boot failure, a chrome bug) which today land on
// Next's built-in ENGLISH dead-end screen ("This page couldn't load")
// in a Spanish-UI app.
//
// The stale-chunk self-heal rides componentDidCatch-equivalent timing
// (the effect on [error]): a redeployed build's hashed chunks heal with
// one guarded reload before the user ever reads the card; every OTHER
// error is a real bug and the card is the honest surface (the digest is
// the operator's correlation handle — Next attaches it server-side).
//
// Deliberately imports NOTHING from the component tree beyond the
// recovery seam — a resilience surface must not depend on the tree that
// might be broken.

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { reloadOnStaleChunk } from "@/lib/chunk-recovery";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reloadOnStaleChunk(error, {
      storage: typeof sessionStorage !== "undefined" ? sessionStorage : null,
    });
  }, [error]);

  return (
    <main
      className="vx-canvas flex min-h-dvh items-center justify-center p-4"
      data-testid="segment-error-card"
    >
      <div className="vx-card w-full max-w-md p-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
          <RotateCcw className="h-7 w-7" strokeWidth={2} />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-slate-800">
          Algo salió mal
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Ocurrió un error inesperado al cargar esta página.
          {error.digest ? ` (ref: ${error.digest})` : ""}
        </p>
        <button
          type="button"
          onClick={reset}
          className="glass-button-primary vx-focus mt-8 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          <RotateCcw className="h-4 w-4" /> Reintentar
        </button>
      </div>
    </main>
  );
}
