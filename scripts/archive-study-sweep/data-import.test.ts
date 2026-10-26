// S23 — the data-import seam (docs/remediation-plan-session23.md).
//
// The restore half of the portability promise: parseImportEnvelope turns a
// downloaded (or hand-crafted) export file into normalized rows ready for
// the upsert-by-id transaction — or an actionable error naming the first
// offender. The seam is PURE (explicit args, zero imports beyond the
// export seam's shared constants) so the unit layer pins it end-to-end:
//
//  - the envelope identity (format + version — shared with the export seam)
//  - the shape rules (known collections only, rows are objects with ids)
//  - the SECRET GUARD (passwordHash/userId stripped — the import-side
//    mirror of NEVER_EXPORT_FIELDS; the importer's own id is re-attached
//    by the route, never by the file)
//  - the FK pre-emption (dangling OPTIONAL FKs nulled — the schema's own
//    SetNull semantics, empirically mandated: Prisma enforces FKs on
//    SQLite [P2003], so the seam MUST pre-validate or the import dies
//    mid-transaction with an opaque error; a dangling REQUIRED FK
//    [cards.deckId] is a corrupt envelope)
//  - the folders topological sort (parents before children — a
//    hand-crafted child-before-parent order would hit P2003; the same
//    pass detects cycles, which must never reach the tree renderer)
//  - IMPORT_FK_MAP completeness (every collection has an entry — a new
//    collection without one fails this test, the INITIAL_COLLECTIONS
//    pattern)
import { describe, expect, it } from "vitest";
import {
  IMPORT_FK_MAP,
  IMPORT_MAX_BYTES,
  parseImportEnvelope,
} from "../src/lib/data-import";
import { EXPORT_COLLECTIONS } from "../src/lib/data-export";

// A minimal valid envelope helper — every test starts from a shape the
// export itself could have produced.
function validEnvelope(): Record<string, unknown> {
  return {
    format: "studyflow-data-export",
    version: 1,
    exportedAt: "2026-10-01T00:00:00.000Z",
    user: { id: "u-exporter", email: "old@account.dev", name: "Old" },
    counts: { subjects: 1, tasks: 1 },
    data: {
      subjects: [{ id: "s1", name: "Math", color: "#8b5cf6", createdAt: "2026-09-01T00:00:00.000Z" }],
      tasks: [{ id: "t1", title: "Read", subjectId: "s1", createdAt: "2026-09-02T00:00:00.000Z" }],
    },
  };
}

describe("the envelope identity (shared with the export seam)", () => {
  it("accepts a valid envelope and normalizes every present collection", () => {
    const res = parseImportEnvelope(validEnvelope());
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows.subjects).toHaveLength(1);
    expect(res.rows.subjects[0]).toEqual({
      id: "s1",
      name: "Math",
      color: "#8b5cf6",
      createdAt: "2026-09-01T00:00:00.000Z",
    });
    expect(res.rows.tasks).toHaveLength(1);
    expect(res.totalRows).toBe(2);
  });

  it("treats a MISSING data key and missing collection keys as empty (the never-branch-on-presence promise)", () => {
    const res = parseImportEnvelope({ format: "studyflow-data-export", version: 1 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows.subjects).toEqual([]);
    expect(res.rows.holidays).toEqual([]);
    expect(res.totalRows).toBe(0);
  });

  it("rejects a wrong format identity", () => {
    const env = validEnvelope() as Record<string, unknown>;
    env.format = "someone-elses-export";
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toContain("studyflow-data-export");
  });

  it("rejects a future version with the actionable message", () => {
    const env = validEnvelope() as Record<string, unknown>;
    env.version = 2;
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toContain("newer version");
  });

  it("rejects a non-object envelope", () => {
    const res = parseImportEnvelope("not an envelope");
    expect(res.ok).toBe(false);
  });
});

describe("the collection shape rules", () => {
  it("rejects an UNKNOWN collection key, naming it", () => {
    const env = validEnvelope() as { data: Record<string, unknown> };
    env.data.passwordResetTokens = [{ id: "x" }];
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toContain("passwordResetTokens");
  });

  it("rejects a non-array collection", () => {
    const env = validEnvelope() as { data: Record<string, unknown> };
    env.data.subjects = { id: "s1" };
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toContain("subjects");
  });

  it("rejects a row that is not an object", () => {
    const env = validEnvelope() as { data: Record<string, unknown> };
    env.data.subjects = ["just a string"];
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(false);
  });

  it("rejects a row without an id, naming the collection", () => {
    const env = validEnvelope() as { data: Record<string, unknown> };
    env.data.subjects = [{ name: "no id" }];
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toContain("subjects");
  });

  it("rejects a row with an empty or non-string id", () => {
    const env = validEnvelope() as { data: Record<string, unknown> };
    env.data.subjects = [{ id: "" }];
    expect(parseImportEnvelope(env).ok).toBe(false);
    const env2 = validEnvelope() as { data: Record<string, unknown> };
    env2.data.subjects = [{ id: 42 }];
    expect(parseImportEnvelope(env2).ok).toBe(false);
  });

  it("rejects duplicate ids within one collection (a corrupt envelope)", () => {
    const env = validEnvelope() as { data: Record<string, unknown> };
    env.data.subjects = [
      { id: "s1", name: "A" },
      { id: "s1", name: "B" },
    ];
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toContain("s1");
    expect(res.error).toContain("subjects");
  });
});

describe("the import-side secret guard", () => {
  it("strips passwordHash and userId from every row (the file never speaks for the account)", () => {
    const env = validEnvelope() as { data: Record<string, Array<Record<string, unknown>>> };
    env.data.subjects[0].passwordHash = "stolen-hash";
    env.data.subjects[0].userId = "someone-else";
    env.data.tasks[0].userId = "attacker";
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows.subjects[0]).not.toHaveProperty("passwordHash");
    expect(res.rows.subjects[0]).not.toHaveProperty("userId");
    expect(res.rows.tasks[0]).not.toHaveProperty("userId");
    expect(res.rows.tasks[0]).toHaveProperty("subjectId", "s1");
  });
});

describe("the FK pre-emption (Prisma enforces FKs — P2003 — the seam pre-validates)", () => {
  it("NULLS a dangling optional FK (tasks.subjectId — the schema's own SetNull semantics)", () => {
    const env = validEnvelope() as { data: Record<string, Array<Record<string, unknown>>> };
    env.data.tasks[0].subjectId = "no-such-subject";
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows.tasks[0]).toHaveProperty("subjectId", null);
  });

  it("NULLS a dangling tasks.listId and notes.notebookId", () => {
    const env = validEnvelope() as { data: Record<string, Array<Record<string, unknown>>> };
    env.data.tasks[0].listId = "no-such-list";
    env.data.notes = [{ id: "n1", title: "Note", notebookId: "no-such-notebook" }];
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows.tasks[0]).toHaveProperty("listId", null);
    expect(res.rows.notes[0]).toHaveProperty("notebookId", null);
  });

  it("NULLS a dangling folders.parentId and files.folderId", () => {
    const env = validEnvelope() as { data: Record<string, Array<Record<string, unknown>>> };
    env.data.folders = [{ id: "f1", name: "Orphan", parentId: "no-such-folder" }];
    env.data.files = [{ id: "file1", name: "a.txt", folderId: "no-such-folder" }];
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows.folders[0]).toHaveProperty("parentId", null);
    expect(res.rows.files[0]).toHaveProperty("folderId", null);
  });

  it("KEEPS a resolvable FK untouched (the happy path)", () => {
    const res = parseImportEnvelope(validEnvelope());
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows.tasks[0]).toHaveProperty("subjectId", "s1");
  });

  it("REJECTS a dangling REQUIRED FK (cards.deckId), naming the collection and row", () => {
    const env = validEnvelope() as { data: Record<string, Array<Record<string, unknown>>> };
    env.data.cards = [{ id: "c1", front: "f", back: "b", deckId: "no-such-deck" }];
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toContain("cards");
    expect(res.error).toContain("c1");
    expect(res.error).toContain("deckId");
  });

  it("nulls a NULL-valued FK harmlessly (already null stays null)", () => {
    const env = validEnvelope() as { data: Record<string, Array<Record<string, unknown>>> };
    env.data.tasks[0].subjectId = null;
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows.tasks[0]).toHaveProperty("subjectId", null);
  });
});

describe("the folders topological sort (self-referential FK)", () => {
  it("reorders child-before-parent rows so parents import first", () => {
    const env = validEnvelope() as { data: Record<string, Array<Record<string, unknown>>> };
    // Child FIRST — a hand-crafted order the DB would reject (P2003).
    env.data.folders = [
      { id: "child", name: "Child", parentId: "parent" },
      { id: "parent", name: "Parent", parentId: null },
    ];
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows.folders.map((f) => f.id)).toEqual(["parent", "child"]);
  });

  it("sorts a three-deep chain scrambled", () => {
    const env = validEnvelope() as { data: Record<string, Array<Record<string, unknown>>> };
    env.data.folders = [
      { id: "g", name: "G", parentId: "top" },
      { id: "top", name: "Top", parentId: null },
      { id: "m", name: "M", parentId: "top" },
    ];
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const ids = res.rows.folders.map((f) => f.id);
    expect(ids.indexOf("top")).toBeLessThan(ids.indexOf("m"));
    expect(ids.indexOf("top")).toBeLessThan(ids.indexOf("g"));
  });

  it("REJECTS a parentId cycle (must never reach the tree renderer)", () => {
    const env = validEnvelope() as { data: Record<string, Array<Record<string, unknown>>> };
    env.data.folders = [
      { id: "a", name: "A", parentId: "b" },
      { id: "b", name: "B", parentId: "a" },
    ];
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toContain("cycle");
  });
});

describe("the informational fields (tolerated, never trusted)", () => {
  it("ignores a stale counts block (rows are re-derived from data)", () => {
    const env = validEnvelope() as Record<string, unknown>;
    env.counts = { subjects: 999, tasks: 999 };
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(true);
  });

  it("ignores the user block entirely (content only, never identity)", () => {
    const env = validEnvelope() as Record<string, unknown>;
    env.user = "garbage-not-even-an-object";
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(true);
  });

  it("tolerates a missing exportedAt", () => {
    const env = validEnvelope() as Record<string, unknown>;
    delete env.exportedAt;
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(true);
  });

  it("passes ISO date strings through untouched (Prisma accepts them as-is)", () => {
    const env = validEnvelope() as { data: Record<string, Array<Record<string, unknown>>> };
    env.data.tasks[0].dueDate = "2026-11-01T12:00:00.000Z";
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows.tasks[0]).toHaveProperty("dueDate", "2026-11-01T12:00:00.000Z");
  });

  it("keeps unknown content fields untouched (forward-compat: the DB validates content)", () => {
    const env = validEnvelope() as { data: Record<string, Array<Record<string, unknown>>> };
    env.data.tasks[0].someFutureField = "v2 adds fields — v1 imports keep them";
    const res = parseImportEnvelope(env);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows.tasks[0]).toHaveProperty("someFutureField");
  });
});

describe("IMPORT_FK_MAP (the completeness pin — the INITIAL_COLLECTIONS pattern)", () => {
  it("covers EXACTLY the export manifest — a new collection without an entry fails here", () => {
    expect(Object.keys(IMPORT_FK_MAP).sort()).toEqual([...EXPORT_COLLECTIONS].sort());
  });

  it("declares cards.deckId as the only REQUIRED FK", () => {
    const required = Object.entries(IMPORT_FK_MAP).flatMap(([collection, specs]) =>
      (specs as { field: string; required?: boolean }[])
        .filter((s) => s.required)
        .map((s) => `${collection}.${s.field}`),
    );
    expect(required).toEqual(["cards.deckId"]);
  });

  it("declares every FK target as a manifest collection (no dangling map entries)", () => {
    const manifest = new Set<string>(EXPORT_COLLECTIONS);
    for (const specs of Object.values(IMPORT_FK_MAP)) {
      for (const spec of specs as { target: string }[]) {
        expect(manifest.has(spec.target)).toBe(true);
      }
    }
  });
});

describe("IMPORT_MAX_BYTES (the documented body cap)", () => {
  it("is 10 MiB — 5x the largest realistic single-user envelope", () => {
    expect(IMPORT_MAX_BYTES).toBe(10 * 1024 * 1024);
  });
});
