// The reference's 404: dark canvas, centered card, violet gradient "404"
// badge, "Página no encontrada", "La página que buscas no existe o fue
// movida.", and the violet "← Ir al Terminal" CTA (reference-measured,
// docs/reference-investigation.md §1).
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NotFoundTitle } from "./not-found-title";

export default function NotFound() {
  return (
    <main className="vx-canvas flex min-h-dvh items-center justify-center p-4">
      <NotFoundTitle />
      <div
        className="vx-card w-full max-w-md p-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
        data-testid="not-found-card"
      >
        <span className="vx-gradient mx-auto flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-[0_10px_30px_rgba(124,58,237,0.5)]">
          404
        </span>
        <h1 className="mt-6 text-2xl font-bold text-slate-800">Página no encontrada</h1>
        <p className="mt-2 text-sm text-slate-400">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          data-testid="not-found-cta"
          className="vx-gradient mt-8 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.45)] transition-transform hover:scale-[1.02]"
        >
          <ArrowLeft className="h-4 w-4" /> Ir al Terminal
        </Link>
      </div>
    </main>
  );
}
