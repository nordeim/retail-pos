// ---------------------------------------------------------------------------
// Next.js instrumentation hook (S22/ADR-020): runs once per server boot —
// dev, next start, and the standalone build (never during next build).
// Asks the PURE seam what to do about the configured AUTH_SECRET:
//
//   - production fatal (missing / blank / the public dev fallback):
//     console.error + process.exit(1). A plain throw is CAUGHT by Next and
//     leaves a degraded 500-everything server — the explicit exit is the
//     validated fail-fast mechanism (pinned by tests/boot-guard-wiring.test.ts;
//     the e2e s22-boot-guard spec cited here before v26 was deleted with the
//     V1 study-layer archive and never replaced — the stale citation swept).
//   - warn (weak production secret / dev without a secret): console.warn.
// ---------------------------------------------------------------------------

import { authSecretBootStatus } from "./lib/env-check";

export async function register(): Promise<void> {
  const status = authSecretBootStatus(
    process.env.NODE_ENV,
    process.env.AUTH_SECRET,
  );

  if (status.level === "fatal") {
    console.error(status.message);
    process.exit(1);
  }
  if (status.level === "warn" && status.message) {
    console.warn(status.message);
  }
}
