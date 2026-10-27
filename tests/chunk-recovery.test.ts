import { describe, expect, it } from "vitest";

import {
  CHUNK_RELOAD_COOLDOWN_MS,
  CHUNK_RELOAD_FLAG,
  isStaleChunkError,
  reloadOnStaleChunk,
  shouldHardReload,
} from "../src/lib/chunk-recovery";

// The V18 pins (docs/remediation-plan-v18.md §B1/F1, SD-70):
//   the stale-chunk self-heal seam — ported from the neo-crm session-170
//   pattern into this app's pure-seam form. The contract: the message
//   family recognizes every bundler form (INCLUDING the Turbopack form
//   captured live on this app: "ChunkLoadError: Failed to load chunk
//   /_next/static/chunks/2w6vrdma1wc3u.js from module 53770"), the
//   cooldown allows ONE reload per 10 s window, the flag is written
//   BEFORE the reload fires (the crash-mid-reload loop guard), and a
//   broken/unavailable storage DISABLES the reload rather than throwing
//   (the recovery path must never throw).

/** Minimal storage double recording call order + contents. */
class StorageDouble {
  store = new Map<string, string>();
  /** Shared event stream (optional): setItem appends "set" here so the
   *  test can assert the flag-write→reload ORDERING against the reload. */
  events: string[] = [];
  getItemCalls = 0;
  setItemCalls: Array<{ key: string; value: string }> = [];

  getItem(key: string): string | null {
    this.getItemCalls += 1;
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.events.push("set");
    this.setItemCalls.push({ key, value });
    this.store.set(key, value);
  }
}

describe("F1/SD-70 — the stale-chunk message family (isStaleChunkError)", () => {
  it("recognizes the bundler message forms incl. the live-captured Turbopack form", () => {
    expect(isStaleChunkError("ChunkLoadError: Loading chunk 42 failed.")).toBe(true);
    expect(isStaleChunkError("Error: Failed to load chunk 1234")).toBe(true);
    expect(isStaleChunkError("Loading chunk 7 failed")).toBe(true);
    expect(
      isStaleChunkError("A dynamically imported module is not available"),
    ).toBe(true);
    // The exact form captured on THIS app (scripts/probe-v18-chunk-failure.ts,
    // plan ledger L6) — Turbopack's runtime shape.
    expect(
      isStaleChunkError(
        "ChunkLoadError: Failed to load chunk /_next/static/chunks/2w6vrdma1wc3u.js from module 53770",
      ),
    ).toBe(true);
  });

  it("passes non-chunk errors through (the recovery must never hijack real bugs)", () => {
    expect(isStaleChunkError("TypeError: x is not a function")).toBe(false);
    expect(isStaleChunkError("")).toBe(false);
    expect(isStaleChunkError("SyntaxError: Unexpected token")).toBe(false);
  });
});

describe("F1/SD-70 — the cooldown arithmetic (shouldHardReload)", () => {
  const MSG = "ChunkLoadError: Failed to load chunk /x.js from module 1";

  it("a first-ever stale chunk reloads (no last-reload timestamp)", () => {
    expect(shouldHardReload(MSG, 1_000, null)).toBe(true);
  });

  it("a stale chunk INSIDE the cooldown window does not reload again", () => {
    expect(shouldHardReload(MSG, 10_000, 5_000)).toBe(false);
  });

  it("a stale chunk AT/PAST the cooldown window reloads again", () => {
    expect(shouldHardReload(MSG, 15_000, 5_000)).toBe(true);
    expect(shouldHardReload(MSG, 100_000, 5_000)).toBe(true);
  });

  it("a NON-chunk error never reloads regardless of the window", () => {
    expect(shouldHardReload("TypeError: x is not a function", 100_000, null)).toBe(false);
  });

  it("the cooldown constant is the documented 10s + the flag carries the app namespace", () => {
    expect(CHUNK_RELOAD_COOLDOWN_MS).toBe(10_000);
    expect(CHUNK_RELOAD_FLAG).toBe("veloxpos:chunk-reload-at");
  });
});

describe("F1/SD-70 — the guarded reload (reloadOnStaleChunk)", () => {
  it("reloads a first-ever stale chunk: the flag written BEFORE the reload fires", () => {
    const storage = new StorageDouble();
    const order = storage.events; // setItem appends "set"; reload appends "reload"
    const ok = reloadOnStaleChunk(
      new Error("ChunkLoadError: Failed to load chunk /x.js from module 1"),
      {
        storage,
        now: () => 1_000,
        reload: () => order.push("reload"),
      },
    );
    expect(ok).toBe(true);
    expect(order).toEqual(["set", "reload"]); // the crash-mid-reload loop guard
    expect(storage.store.get(CHUNK_RELOAD_FLAG)).toBe("1000");
  });

  it("a second stale chunk inside the cooldown does NOT reload", () => {
    const storage = new StorageDouble();
    storage.store.set(CHUNK_RELOAD_FLAG, "1000");
    let reloads = 0;
    const ok = reloadOnStaleChunk(new Error("Failed to load chunk 7"), {
      storage,
      now: () => 6_000,
      reload: () => {
        reloads += 1;
      },
    });
    expect(ok).toBe(false);
    expect(reloads).toBe(0);
  });

  it("a NON-chunk error returns false and touches no storage", () => {
    const storage = new StorageDouble();
    const ok = reloadOnStaleChunk(new Error("TypeError: x is not a function"), {
      storage,
      now: () => 1_000,
      reload: () => {
        throw new Error("must not reload");
      },
    });
    expect(ok).toBe(false);
    expect(storage.getItemCalls).toBe(0);
    expect(storage.setItemCalls).toHaveLength(0);
  });

  it("unavailable storage DISABLES the reload — the recovery path never throws", () => {
    // Safari private mode / disabled storage: getItem throws.
    const broken: Pick<Storage, "getItem" | "setItem"> = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(() =>
      reloadOnStaleChunk(new Error("ChunkLoadError: Loading chunk 1 failed"), {
        storage: broken,
        now: () => 1_000,
        reload: () => {
          throw new Error("must not reload when storage is unavailable");
        },
      }),
    ).not.toThrow();
  });

  it("a corrupt stored record is treated as absent (the first-reload path)", () => {
    const storage = new StorageDouble();
    storage.store.set(CHUNK_RELOAD_FLAG, "not-a-number");
    let reloads = 0;
    const ok = reloadOnStaleChunk(new Error("ChunkLoadError: Loading chunk 1 failed"), {
      storage,
      now: () => 1_000,
      reload: () => {
        reloads += 1;
      },
    });
    expect(ok).toBe(true); // corrupt → absent → first-reload semantics
    expect(reloads).toBe(1);
  });

  it("a broken reload hook must not take the seam down", () => {
    const storage = new StorageDouble();
    expect(() =>
      reloadOnStaleChunk(new Error("ChunkLoadError: Loading chunk 1 failed"), {
        storage,
        now: () => 1_000,
        reload: () => {
          throw new Error("reload exploded");
        },
      }),
    ).not.toThrow();
  });
});
