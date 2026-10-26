import { describe, expect, it } from "vitest";
import { buildBreadcrumbChain, wouldCreateCycle } from "@/lib/folder-tree";

// The breadcrumb seam (S84/AK1): the walk from the current folder to the
// root must terminate over ANY row set — the wedge class it replaces was
// verified live (a cycled row set fed the unbounded inline walk and froze
// the renderer permanently). Every case here pins termination + order.

interface TestFolder {
  id: string;
  parentId: string | null;
  name?: string;
}

describe("buildBreadcrumbChain", () => {
  const root: TestFolder = { id: "root", parentId: null };
  const child: TestFolder = { id: "child", parentId: "root" };
  const grandchild: TestFolder = { id: "grand", parentId: "child" };

  it("walks a linear chain root-first", () => {
    const chain = buildBreadcrumbChain([root, child, grandchild], "grand");
    expect(chain.map((f) => f.id)).toEqual(["root", "child", "grand"]);
  });

  it("returns only the current folder when it is the root", () => {
    const chain = buildBreadcrumbChain([root, child, grandchild], "root");
    expect(chain.map((f) => f.id)).toEqual(["root"]);
  });

  it("returns an empty chain for a null current folder", () => {
    expect(buildBreadcrumbChain([root, child], null)).toEqual([]);
  });

  it("returns an empty chain when the current folder is not in the row set", () => {
    expect(buildBreadcrumbChain([root, child], "missing")).toEqual([]);
  });

  it("bounds the walk on a self-parenting row (the verified wedge class)", () => {
    const selfCycle: TestFolder = { id: "poisoned", parentId: "poisoned" };
    // Pre-guard, this row set froze the tab: cursor never left the folder.
    const chain = buildBreadcrumbChain([selfCycle], "poisoned");
    expect(chain.map((f) => f.id)).toEqual(["poisoned"]);
  });

  it("bounds the walk on a mutual A→B→A cycle", () => {
    const a: TestFolder = { id: "a", parentId: "b" };
    const b: TestFolder = { id: "b", parentId: "a" };
    const chain = buildBreadcrumbChain([a, b], "a");
    // Bounded (no wedge); the chain contains each cycled row at most once.
    expect(chain.map((f) => f.id)).toEqual(["b", "a"]);
    expect(chain.length).toBeLessThanOrEqual(2);
  });

  it("terminates on a dangling parent id", () => {
    const orphan: TestFolder = { id: "orphan", parentId: "deleted-folder" };
    const chain = buildBreadcrumbChain([orphan, root], "orphan");
    expect(chain.map((f) => f.id)).toEqual(["orphan"]);
  });

  it("stops the ascent at the cycle when a healthy branch feeds into one", () => {
    // A real pre-poisoned shape: a valid folder whose ANCESTORS are cycled.
    const a: TestFolder = { id: "a", parentId: "b" };
    const b: TestFolder = { id: "b", parentId: "a" };
    const healthy: TestFolder = { id: "good", parentId: "a" };
    const chain = buildBreadcrumbChain([a, b, healthy], "good");
    // good → a → b → (a revisited: stop) — every row at most once.
    expect(chain.map((f) => f.id)).toEqual(["b", "a", "good"]);
  });
});

// The cycle-guard seam (S85/AL3 — the s85 audit's L4): the server PATCH's
// ancestor walk was inline and unpinned — removing its visited set passed
// the entire 463-test e2e suite (the audit's mutation-survival finding).
// These pins make the walk's verdict + termination a unit contract,
// mirroring the client seam's table. The mutation proof (below, recorded
// in the execution log): removing the visited set wedges the runner on the
// pre-existing-cycle cases.

describe("wouldCreateCycle", () => {
  const root: TestFolder = { id: "root", parentId: null };
  const a: TestFolder = { id: "a", parentId: "root" };
  const b: TestFolder = { id: "b", parentId: "a" };

  it("rejects self-parenting", () => {
    expect(wouldCreateCycle([root, a], "a", "a")).toBe(true);
  });

  it("rejects the A→B→A descendant cycle (moving A under its own child)", () => {
    // b lives under a; moving a under b closes the cycle.
    expect(wouldCreateCycle([root, a, b], "a", "b")).toBe(true);
  });

  it("allows a valid re-parent into an unrelated branch", () => {
    const c: TestFolder = { id: "c", parentId: "root" };
    expect(wouldCreateCycle([root, a, c], "a", "c")).toBe(false);
    // and a re-root... no — re-rooting never reaches the guard (parentId
    // null bypasses it); this is the sibling move under the root's chain.
    expect(wouldCreateCycle([root, a, c], "c", "root")).toBe(false);
  });

  it("terminates on a PRE-EXISTING cycle that does not involve the moved folder", () => {
    // A poisoned/imported DB: x↔y cycled, unrelated to the move a→b-side.
    const x: TestFolder = { id: "x", parentId: "y" };
    const y: TestFolder = { id: "y", parentId: "x" };
    const c: TestFolder = { id: "c", parentId: "x" };
    // Moving a under c: c's ancestor chain is c→x→y→(x revisited: STOP) —
    // it never reaches a, so the move is ALLOWED (the write is legal; the
    // client seam renders the poisoned branch bounded).
    expect(wouldCreateCycle([root, a, x, y, c], "a", "c")).toBe(false);
  });

  it("rejects a move whose ancestor chain passes THROUGH the moved folder", () => {
    // The pre-existing-cycle-through-id shape: a's chain already contains
    // the moved folder id above the candidate parent.
    const poisonedChild: TestFolder = { id: "poisoned", parentId: "a" };
    // Moving root under poisonedChild: chain poisonedChild→a→root — hits
    // the moved folder (root) — rejected.
    expect(wouldCreateCycle([root, a, poisonedChild], "root", "poisoned")).toBe(true);
  });

  it("terminates on a dangling ancestor (the walk simply ends)", () => {
    const orphan: TestFolder = { id: "orphan", parentId: "deleted" };
    expect(wouldCreateCycle([root, a, orphan], "a", "orphan")).toBe(false);
  });

  it("returns false on an empty row set (the caller's 404 governs)", () => {
    expect(wouldCreateCycle([], "a", "b")).toBe(false);
  });

  it("evaluates the chain even when the moved folder is absent from the rows", () => {
    // The PATCH's findMany is userId-scoped but the moved row is loaded by
    // id earlier; the seam must not require its presence.
    const c: TestFolder = { id: "c", parentId: "root" };
    expect(wouldCreateCycle([root, c], "a", "c")).toBe(false);
    // and the self-parent case never depends on the rows at all.
    expect(wouldCreateCycle([root, c], "a", "a")).toBe(true);
  });
});
