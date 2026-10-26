// S16-A — the per-view initial-collections seam. The dashboard CLS finding
// (0.117: the shell flipped on auth with an empty store, then data arrival
// re-laid the conditional banner + sections out from under the viewport)
// is fixed by pre-warming the ACTIVE view's collections in parallel with
// the auth call. This seam is the single source of "what does each view
// need before its first paint" — the unit pins keep it complete (a new
// view that forgets its entry regresses to the S15 load shift silently).
import { describe, expect, it } from "vitest";
import { VIEWS, type ViewId } from "../src/lib/router";
import { INITIAL_COLLECTIONS } from "../src/lib/view-collections";
import { PATHS } from "../src/lib/data";

describe("INITIAL_COLLECTIONS (S16-A pre-warm seam)", () => {
  it("declares an entry for every view id (20/20 — a missing entry is a CLS regression)", () => {
    expect(Object.keys(INITIAL_COLLECTIONS).sort()).toEqual([...VIEWS].sort());
  });

  it("every entry is an array of valid collection keys", () => {
    const validKeys = new Set(Object.keys(PATHS));
    for (const [view, keys] of Object.entries(INITIAL_COLLECTIONS)) {
      expect(Array.isArray(keys), `${view} entry must be an array`).toBe(true);
      for (const key of keys) {
        expect(validKeys.has(key as string), `${view} declares unknown collection "${String(key)}"`).toBe(true);
      }
    }
  });

  it("the dashboard pre-warms exactly the collections its own effect fetches", () => {
    expect(INITIAL_COLLECTIONS.dashboard).toEqual([
      "tasks",
      "assignments",
      "exams",
      "focusSessions",
      "subjects",
    ]);
  });

  it("mirrors the heaviest views' own loadAll sets (analytics + calendar + tasks)", () => {
    expect(INITIAL_COLLECTIONS.analytics).toEqual([
      "tasks",
      "focusSessions",
      "grades",
      "assignments",
      "exams",
      "subjects",
    ]);
    expect(INITIAL_COLLECTIONS.calendar).toEqual([
      "events",
      "exams",
      "assignments",
      "tasks",
      "timetable",
      "subjects",
    ]);
    expect(INITIAL_COLLECTIONS.tasks).toEqual(["tasks", "taskLists", "subjects"]);
  });

  it("the three no-data views declare empty sets (they gate on auth alone)", () => {
    const idle: ViewId[] = ["calculator", "mathsolver", "aiassistant"];
    for (const id of idle) {
      expect(INITIAL_COLLECTIONS[id]).toEqual([]);
    }
  });
});
