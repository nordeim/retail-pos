"use client";

// The ROOT error net (V18/F1, SD-70 — the neo-crm session-170 pattern
// adapted to this app). global-error replaces the root layout entirely
// when the layout itself fails — so it must render its own
// <html lang="es"> + <body> AND import ./globals.css itself: a crashed
// root layout never loaded the global stylesheet, and the classes below
// would otherwise render as bare prose (the Next docs' own caveat — the
// import is the robust form; it is deduplicated when the stylesheet is
// already loaded).
//
// Same contract as the segment net (src/app/error.tsx): the stale-chunk
// self-heal in the effect, the digest correlation handle, the reset()
// affordance, and ZERO component-tree imports — the root failure must
// not stand on the tree that broke.

import "./globals.css";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { reloadOnStaleChunk } from "@/lib/chunk-recovery";

export default function GlobalError({
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
    <html lang="es">
      <body className="vx-canvas min-h-dvh">
        <main className="flex min-h-dvh items-center justify-center p-4">
          <div
            role="alert"
            className="vx-card w-full max-w-md p-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            data-testid="global-error-card"
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
              <RotateCcw className="h-7 w-7" strokeWidth={2} />
            </span>
            <h1 className="mt-6 text-2xl font-bold text-slate-800">
              Algo salió mal
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Ocurrió un error crítico en la aplicación.
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
      </body>
    </html>
  );
}
