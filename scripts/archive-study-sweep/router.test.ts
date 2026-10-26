import { describe, expect, it } from "vitest";
import { NAV_ITEMS, currentGreeting, greetingForHour, pathForView, viewFromPath, VIEWS } from "@/lib/router";
import { startOfDay } from "@/lib/date";

describe("viewFromPath", () => {
  it("maps every canonical PascalCase path to its view id", () => {
    for (const item of NAV_ITEMS) {
      expect(viewFromPath(item.path)).toBe(item.id);
    }
  });

  it("maps the root and unknown paths to the dashboard", () => {
    expect(viewFromPath("/")).toBe("dashboard");
    expect(viewFromPath("")).toBe("dashboard");
    expect(viewFromPath("/nope")).toBe("dashboard");
    expect(viewFromPath("/Tasks/extra")).toBe("tasks"); // first segment wins
  });

  it("is case-insensitive and tolerates trailing slashes", () => {
    expect(viewFromPath("/tasks")).toBe("tasks");
    expect(viewFromPath("/TASKS/")).toBe("tasks");
    expect(viewFromPath("/MyDay///")).toBe("myday");
  });
});

describe("pathForView", () => {
  it("round-trips with viewFromPath for all views", () => {
    for (const view of VIEWS) {
      expect(viewFromPath(pathForView(view))).toBe(view);
    }
  });

  it("falls back to /Dashboard for unknown ids", () => {
    expect(pathForView("unknown" as never)).toBe("/Dashboard");
  });
});

describe("NAV_ITEMS", () => {
  it("contains all 20 reference views in order", () => {
    expect(NAV_ITEMS).toHaveLength(20);
    expect(NAV_ITEMS[0]).toMatchObject({ id: "dashboard", label: "Dashboard", path: "/Dashboard" });
    expect(NAV_ITEMS[19]).toMatchObject({ id: "settings", label: "Settings", path: "/Settings" });
  });

  it("has unique paths and labels", () => {
    expect(new Set(NAV_ITEMS.map((n) => n.path)).size).toBe(NAV_ITEMS.length);
    expect(new Set(NAV_ITEMS.map((n) => n.label)).size).toBe(NAV_ITEMS.length);
  });
});

describe("greetingForHour", () => {
  // Fake-clock probe of the live reference (all 24 hours mapped):
  // 0-11 → morning, 12-16 → afternoon, 17-23 → evening. "Good night"
  // never appears in the reference's greeting.
  it("buckets hours like the reference app (morning covers 0-11, no night bucket)", () => {
    expect(greetingForHour(0)).toBe("Good morning");
    expect(greetingForHour(3)).toBe("Good morning");
    expect(greetingForHour(4)).toBe("Good morning");
    expect(greetingForHour(6)).toBe("Good morning");
    expect(greetingForHour(11)).toBe("Good morning");
    expect(greetingForHour(12)).toBe("Good afternoon");
    expect(greetingForHour(13)).toBe("Good afternoon");
    expect(greetingForHour(16)).toBe("Good afternoon");
    expect(greetingForHour(17)).toBe("Good evening");
    expect(greetingForHour(18)).toBe("Good evening");
    expect(greetingForHour(23)).toBe("Good evening");
  });

  it("never returns 'Good night' (the reference has no such bucket)", () => {
    for (let h = 0; h < 24; h++) {
      expect(greetingForHour(h)).not.toBe("Good night");
    }
  });
});

describe("currentGreeting (the live-clock greeting — session-63)", () => {
  // The reference renders the greeting from the CURRENT wall clock
  // ("Good evening, …" captured at 19:08 local —
  // docs/screenshots/63-ref-desktop-dashboard-evening-greeting.png).
  // The clone rendered "Good morning" at every hour because the view call
  // sites fed greetingForHour a midnight-anchored `today` whose
  // getHours() is always 0. currentGreeting is the correct seam: it reads
  // the hour of the date it is handed, and the views must hand it the
  // LIVE clock — never the day-anchor.
  it("reads the hour of the given date across all three buckets", () => {
    expect(currentGreeting(new Date(2026, 9, 19, 0))).toBe("Good morning");
    expect(currentGreeting(new Date(2026, 9, 19, 8))).toBe("Good morning");
    expect(currentGreeting(new Date(2026, 9, 19, 11))).toBe("Good morning");
    expect(currentGreeting(new Date(2026, 9, 19, 12))).toBe("Good afternoon");
    expect(currentGreeting(new Date(2026, 9, 19, 16))).toBe("Good afternoon");
    expect(currentGreeting(new Date(2026, 9, 19, 17))).toBe("Good evening");
    expect(currentGreeting(new Date(2026, 9, 19, 19))).toBe("Good evening");
    expect(currentGreeting(new Date(2026, 9, 19, 23))).toBe("Good evening");
  });

  it("documents the trap: a startOfDay anchor reads hour 0, i.e. 'Good morning' at any wall-clock hour", () => {
    const evening = new Date(2026, 9, 19, 19, 8);
    expect(currentGreeting(startOfDay(evening))).toBe("Good morning");
    expect(currentGreeting(evening)).toBe("Good evening");
  });
});
