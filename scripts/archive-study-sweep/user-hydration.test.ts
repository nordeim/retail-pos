// Regression: the wire contract of /api/auth/me (and every other user-bearing
// response) is `publicUser()`'s shape — the API's public field is `name`, NOT
// the DB's `fullName` (see src/lib/server/auth.ts:66). The client AppUser type
// declared `fullName`, so loadFromUser read a field the wire never sends:
// userName stayed "" forever and every name-bearing surface silently fell
// back ("Good morning, there 👋", sidebar "StudyFlow user"). This file pins
// the hydrate path against the ACTUAL wire shape.
import { describe, expect, it } from "vitest";

import { useThemeStore, type AppUser } from "@/lib/store";

function wireUser(overrides: Partial<AppUser> = {}): AppUser {
  // Shape mirrors publicUser() — `name`, not `fullName`.
  return {
    id: "usr-1",
    email: "demo@studyflow.app",
    name: "Demo Student",
    avatarEmoji: "",
    themeMode: "light",
    accentColor: "violet",
    notificationsEnabled: false,
    schoolName: "Lincoln High",
    gradeLevel: "9th Grade",
    studyGoalHours: 4,
    emailVerified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("theme store user hydration (the publicUser wire contract)", () => {
  it("hydrates userName from the wire field `name`", () => {
    const store = useThemeStore.getState();
    store.loadFromUser(wireUser({ name: "Demo Student" }));
    expect(useThemeStore.getState().userName).toBe("Demo Student");
    expect(useThemeStore.getState().email).toBe("demo@studyflow.app");
  });

  it("coerces a non-string name to the empty-string fallback (defensive union)", () => {
    const store = useThemeStore.getState();
    store.loadFromUser(
      wireUser({ name: undefined as unknown as string }),
    );
    expect(useThemeStore.getState().userName).toBe("");
  });

  it("the type carried by user-bearing responses compiles against publicUser's shape", () => {
    // A compile-time pin: AppUser must NOT re-introduce a required `fullName`
    // field the API never sends (that exact drift hid the bug from tsc).
    const user: AppUser = wireUser();
    const name: string = user.name;
    expect(typeof name).toBe("string");
  });
});
