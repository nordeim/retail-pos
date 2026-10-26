import { execSync } from "node:child_process";
import path from "node:path";

/**
 * Playwright global setup: guarantee the isolated e2e database exists and
 * carries the demo seed, so every spec run starts from the same state.
 *
 * The database lives at <repo>/db/e2e.db (gitignored like every db/*.db).
 * DATABASE_URL is SHELL-provided here, and the Prisma CLI anchors
 * shell-provided relative `file:` URLs against prisma/schema.prisma — so
 * `file:../db/e2e.db` targets <repo>/db/e2e.db (empirically verified; see
 * prisma/schema.prisma's DATABASE PATH CONTRACT note). The seed resolves
 * the same env var at runtime through src/lib/db-path.ts.
 */
export default function globalSetup(): void {
  const repo = path.resolve(__dirname, "..", "..");
  const env = {
    ...process.env,
    DATABASE_URL: "file:../db/e2e.db",
    // Pin the seed identity: bun auto-loads .env, so an unset var would
    // otherwise leak the developer's local owner into the e2e database.
    SEED_OWNER_EMAIL: "owner@veloxpos.local",
    SEED_OWNER_PASSWORD: "VeloxDemo123!",
    SEED_OWNER_NAME: "Cesar Martínez",
  } as NodeJS.ProcessEnv;

  const run = (cmd: string) => execSync(cmd, { cwd: repo, env, stdio: "pipe" }).toString();

  // --force-reset: every run starts from the SAME seeded state (the sale
  // specs decrement stock; cumulative drift would break their pins).
  try {
    run("bunx prisma db push --skip-generate --accept-data-loss --force-reset");
  } catch {
    run("npx prisma db push --skip-generate --accept-data-loss --force-reset");
  }
  try {
    run("bun prisma/seed.ts");
  } catch {
    run("npx tsx prisma/seed.ts");
  }
}
