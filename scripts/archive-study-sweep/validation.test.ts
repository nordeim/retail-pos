import { describe, expect, it } from "vitest";
import {
  assignmentSchema,
  aiChatSchema,
  changeEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
  eventSchema,
  examSchema,
  flashcardDeckSchema,
  flashcardSchema,
  forgotPasswordSchema,
  loginSchema,
  mathSolveSchema,
  practiceTestSchema,
  preferencesSchema,
  resetPasswordSchema,
  rumBatchSchema,
  rumEventSchema,
  studyGroupSchema,
  subjectSchema,
  taskSchema,
  timetableClassSchema,
  verifyEmailSchema,
} from "@/lib/validation";

describe("loginSchema", () => {
  it("accepts a valid login and rejects short passwords / bad emails", () => {
    expect(loginSchema.safeParse({ email: "demo@studyflow.app", password: "Demo1234!" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "demo@studyflow.app", password: "short" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "not-an-email", password: "Demo1234!" }).success).toBe(false);
    expect(loginSchema.safeParse({}).success).toBe(false);
  });
});

describe("taskSchema", () => {
  it("applies defaults and bounds the title", () => {
    const parsed = taskSchema.parse({ title: "Read chapter 4" });
    expect(parsed.completed).toBe(false);
    expect(parsed.important).toBe(false);
    expect(parsed.notes).toBe("");
    expect(taskSchema.safeParse({ title: "" }).success).toBe(false);
    expect(taskSchema.safeParse({ title: "x".repeat(201) }).success).toBe(false);
  });

  it("normalizes empty date strings to null", () => {
    const parsed = taskSchema.parse({ title: "t", dueDate: "" });
    expect(parsed.dueDate).toBeNull();
  });

  it("carries the S6-B reference dialog fields: priority, repeat, myDay, subtasks", () => {
    // The reference's Add/Edit Task dialog (measured live) has a Priority
    // combobox (None/Low/Medium/High), a Repeat combobox (No repeat/Daily/
    // Weekly/Monthly), a My Day toggle, and a subtask adder. Subtasks
    // persist as a JSON array of {id,title,done} objects.
    const parsed = taskSchema.parse({ title: "t" });
    expect(parsed.priority).toBe("none");
    expect(parsed.repeat).toBe("none");
    expect(parsed.myDay).toBe(false);
    expect(parsed.subtasks).toBe("[]");

    const full = taskSchema.parse({
      title: "t",
      priority: "high",
      repeat: "weekly",
      myDay: true,
      subtasks: '[{"id":"s1","title":"First","done":false}]',
    });
    expect(full.priority).toBe("high");
    expect(full.repeat).toBe("weekly");
    expect(full.myDay).toBe(true);
    expect(full.subtasks).toBe('[{"id":"s1","title":"First","done":false}]');

    expect(taskSchema.safeParse({ title: "t", priority: "urgent" }).success).toBe(false);
    expect(taskSchema.safeParse({ title: "t", repeat: "sometimes" }).success).toBe(false);
    expect(taskSchema.safeParse({ title: "t", subtasks: "not-json" }).success).toBe(false);
    expect(taskSchema.safeParse({ title: "t", subtasks: "[{\"id\":1" }).success).toBe(false);
  });
});

describe("assignmentSchema", () => {
  it("carries the S6-E reference row fields: type, progress, urgent priority", () => {
    // The reference's assignment row (measured) shows a type pill
    // (homework/essay/project/...) and an interactive progress slider
    // (0-100), and its dialog Priority combobox offers Low/Medium/High/Urgent.
    const parsed = assignmentSchema.parse({ title: "Problem set" });
    expect(parsed.type).toBe("homework");
    expect(parsed.progress).toBe(0);
    expect(parsed.priority).toBe("medium");

    const full = assignmentSchema.parse({ title: "P", type: "essay", progress: 65, priority: "urgent" });
    expect(full.type).toBe("essay");
    expect(full.progress).toBe(65);
    expect(full.priority).toBe("urgent");

    expect(assignmentSchema.safeParse({ title: "P", type: "unknown-kind" }).success).toBe(false);
    expect(assignmentSchema.safeParse({ title: "P", progress: 101 }).success).toBe(false);
    expect(assignmentSchema.safeParse({ title: "P", progress: -1 }).success).toBe(false);
  });

  it("accepts the seeded \"worksheet\" type (AC10 — the enum missed a seed value)", () => {
    // The seed ships "Problem set 6" with type "worksheet" — outside the
    // enum since the S6 era, so editing that row 400s. The row renders
    // (the API only validates writes) and is pinned by S6-E; the enum
    // catches up to the seed.
    expect(assignmentSchema.safeParse({ title: "P", type: "worksheet" }).success).toBe(true);
  });
});

describe("subjectSchema", () => {
  it("validates the hex color format", () => {
    expect(subjectSchema.safeParse({ name: "Math" }).success).toBe(true);
    expect(subjectSchema.parse({ name: "Math" }).color).toBe("#8b5cf6");
    expect(subjectSchema.safeParse({ name: "Math", color: "violet" }).success).toBe(false);
    expect(subjectSchema.safeParse({ name: "Math", color: "#8b5c" }).success).toBe(false);
  });
});

describe("examSchema", () => {
  it("requires a date and accepts optional fields", () => {
    const ok = examSchema.safeParse({ title: "Midterm", date: "2026-10-13T09:00:00" });
    expect(ok.success).toBe(true);
    expect(examSchema.safeParse({ title: "Midterm" }).success).toBe(false);
  });

  it("carries the S6-F reference card fields: type, duration, topics", () => {
    // The reference's exam cards (measured) show a type footer pill
    // (test/quiz/midterm/final/oral/practical) and a "12:00 AM · 60 min"
    // clock line; its dialog has a duration spinbutton (default 60) and a
    // topics adder. Topics persist as a JSON string array.
    const parsed = examSchema.parse({ title: "Midterm", date: "2026-10-13T09:00:00" });
    expect(parsed.type).toBe("test");
    expect(parsed.duration).toBe(60);
    expect(parsed.topics).toBe("[]");

    const full = examSchema.parse({
      title: "Midterm",
      date: "2026-10-13T09:00:00",
      type: "oral",
      duration: 120,
      topics: '["Integrals","Series"]',
    });
    expect(full.type).toBe("oral");
    expect(full.duration).toBe(120);
    expect(full.topics).toBe('["Integrals","Series"]');

    expect(examSchema.safeParse({ title: "M", date: "2026-10-13T09:00:00", type: "final-exam" }).success).toBe(false);
    expect(examSchema.safeParse({ title: "M", date: "2026-10-13T09:00:00", duration: 4 }).success).toBe(false);
    expect(examSchema.safeParse({ title: "M", date: "2026-10-13T09:00:00", duration: 6000 }).success).toBe(false);
    expect(examSchema.safeParse({ title: "M", date: "2026-10-13T09:00:00", topics: "not-json" }).success).toBe(false);
  });

  it("carries the S76 location field (AC5 — the ref card's \ud83d\udccd row + dialog Location input)", () => {
    // Measured on the reference (2026-10-21, ref-ac-remeasure-s76.mjs): the
    // Add Exam dialog has a Location input (placeholder "e.g., Room 101,
    // Hall A") and the card renders a map-pin row when it is set. The
    // eventSchema location pattern: optional string, max 200, default "".
    const parsed = examSchema.parse({ title: "Midterm", date: "2026-10-13T09:00:00" });
    expect(parsed.location).toBe("");
    const withLoc = examSchema.parse({
      title: "Midterm",
      date: "2026-10-13T09:00:00",
      location: "Room 3B",
    });
    expect(withLoc.location).toBe("Room 3B");
    expect(
      examSchema.safeParse({ title: "M", date: "2026-10-13T09:00:00", location: "x".repeat(201) }).success,
    ).toBe(false);
  });
});

describe("eventSchema", () => {
  it("keeps the color default and the allDay flag", () => {
    const parsed = eventSchema.parse({ title: "Study group", startDate: "2026-10-06T17:00:00" });
    expect(parsed.allDay).toBe(false);
    expect(parsed.color).toBe("#8b5cf6");
  });

  it("carries the S5-B2 reference dialog fields: location, repeat, reminders", () => {
    // The reference's New Event dialog (measured) has Location / Link,
    // Repeat (combobox, "No repeat" default) and multi-reminders (minutes
    // before). Reminders persist as a JSON array of minute offsets.
    const parsed = eventSchema.parse({ title: "Study group", startDate: "2026-10-06T17:00:00" });
    expect(parsed.location).toBe("");
    expect(parsed.repeat).toBe("none");
    expect(parsed.reminders).toBe("[]");

    const full = eventSchema.parse({
      title: "Advising",
      startDate: "2026-10-06T17:00:00",
      location: "Room 210",
      repeat: "weekly",
      reminders: "[15,60]",
    });
    expect(full.location).toBe("Room 210");
    expect(full.repeat).toBe("weekly");
    expect(full.reminders).toBe("[15,60]");

    expect(eventSchema.safeParse({ title: "X", startDate: "2026-10-06T17:00:00", repeat: "sometimes" }).success).toBe(false);
    expect(eventSchema.safeParse({ title: "X", startDate: "2026-10-06T17:00:00", reminders: "not-json" }).success).toBe(false);
    expect(eventSchema.safeParse({ title: "X", startDate: "2026-10-06T17:00:00", reminders: "[15," }).success).toBe(false);
  });
});

describe("timetableClassSchema", () => {
  it("defaults weekType to ALL and accepts Week A / Week B (S5-J)", () => {
    // The reference's Timetable header carries an "All Weeks" select with
    // options All Weeks / Week A / Week B (measured) — alternating-week
    // timetables. The schema models it as weekType ALL|A|B.
    const parsed = timetableClassSchema.parse({
      name: "Calculus II",
      dayOfWeek: 0,
      startTime: "9:00",
      endTime: "10:30",
    });
    expect(parsed.weekType).toBe("ALL");
    expect(parsed.room).toBe("");

    const weekA = timetableClassSchema.parse({
      name: "Lab",
      dayOfWeek: 1,
      startTime: "14:00",
      endTime: "16:00",
      weekType: "A",
    });
    expect(weekA.weekType).toBe("A");

    expect(
      timetableClassSchema.safeParse({
        name: "Lab",
        dayOfWeek: 1,
        startTime: "14:00",
        endTime: "16:00",
        weekType: "C",
      }).success,
    ).toBe(false);
  });
});

describe("studyGroupSchema", () => {
  it("caps members at 50 and validates emails", () => {
    const ok = studyGroupSchema.safeParse({
      name: "Calc Crew",
      members: [{ name: "Ari", email: "ari@example.com" }],
    });
    expect(ok.success).toBe(true);
    expect(
      studyGroupSchema.safeParse({
        name: "Crew",
        members: [{ name: "X", email: "not-an-email" }],
      }).success,
    ).toBe(false);
    expect(
      studyGroupSchema.safeParse({
        name: "Crew",
        members: Array.from({ length: 51 }, () => ({ name: "x", email: "" })),
      }).success,
    ).toBe(false);
  });

  // AM1 (the s86 audit's L2): the server schema must agree with the
  // client seam's blank-after-trim drop — a blank member name passes
  // length-based min(1) and persists, the seam drops it on read, and
  // the next member write permanently deletes the row. Trim runs BEFORE
  // the checks, so blanks are rejected and padded values are stored
  // trimmed (the boundary both sides now share).
  it("AM1: rejects a blank member name (the seam/server alignment)", () => {
    // The email must be unimpeachable (zod4 rejects 1-char TLDs like
    // a@b.c) so the pin discriminates ONLY the blank name — a pin that
    // fails for the wrong reason verifies nothing (the S82 lesson).
    expect(
      studyGroupSchema.safeParse({
        name: "Crew",
        members: [{ name: "   ", email: "member@example.com" }],
      }).success,
    ).toBe(false);
  });

  it("AM1: trims a padded member name before persisting", () => {
    const parsed = studyGroupSchema.safeParse({
      name: "Crew",
      members: [{ name: "  Ari  ", email: "ari@example.com" }],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.members[0]?.name).toBe("Ari");
    }
  });

  it("AM1: trims a padded member email before validating", () => {
    const parsed = studyGroupSchema.safeParse({
      name: "Crew",
      members: [{ name: "Ari", email: "  ari@example.com " }],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.members[0]?.email).toBe("ari@example.com");
    }
  });

  it("AM1: the valid baseline is unchanged (regression guard)", () => {
    const parsed = studyGroupSchema.safeParse({
      name: "Crew",
      members: [{ name: "Ari", email: "ari@example.com" }],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.members[0]).toEqual({
        name: "Ari",
        email: "ari@example.com",
      });
    }
  });

  it("AM1: a blank member email stays rejected (regression guard)", () => {
    expect(
      studyGroupSchema.safeParse({
        name: "Crew",
        members: [{ name: "Ari", email: "   " }],
      }).success,
    ).toBe(false);
  });
});

describe("preferencesSchema", () => {
  it("only accepts the documented enum values", () => {
    expect(preferencesSchema.safeParse({ themeMode: "dark", accentColor: "teal" }).success).toBe(true);
    expect(preferencesSchema.safeParse({ themeMode: "auto" }).success).toBe(false);
    expect(preferencesSchema.safeParse({ accentColor: "purple" }).success).toBe(false);
    expect(preferencesSchema.safeParse({ avatarEmoji: "🎓" }).success).toBe(true);
    expect(preferencesSchema.safeParse({ avatarEmoji: "🎓".repeat(9) }).success).toBe(false); // 9 code points > 8 (zod v4 counts code points)
  });

  // S17-A — the reference's Profile tab persists four study-profile fields
  // on its User entity (captured from the reference's own PUT body):
  // school_name / grade_level / study_goal_hours / notifications_enabled.
  it("accepts the S17 study-profile fields (school, grade, goal, notifications)", () => {
    expect(
      preferencesSchema.safeParse({
        schoolName: "Lincoln High",
        gradeLevel: "9th Grade",
        studyGoalHours: 4,
        notificationsEnabled: false,
      }).success,
    ).toBe(true);
    // all optional — a partial PATCH still parses
    expect(preferencesSchema.safeParse({ schoolName: "" }).success).toBe(true);
    expect(preferencesSchema.safeParse({ notificationsEnabled: true }).success).toBe(true);
  });

  it("accepts every reference-measured Grade Level option (12 total)", () => {
    const grades = [
      "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade",
      "College Freshman", "College Sophomore", "College Junior", "College Senior", "Graduate",
    ];
    for (const g of grades) {
      expect(preferencesSchema.safeParse({ gradeLevel: g }).success).toBe(true);
    }
    expect(preferencesSchema.safeParse({ gradeLevel: "13th Grade" }).success).toBe(false);
    expect(preferencesSchema.safeParse({ gradeLevel: "Kindergarten" }).success).toBe(false);
  });

  it("bounds the study goal to the reference's 1–12 hour slider range", () => {
    expect(preferencesSchema.safeParse({ studyGoalHours: 1 }).success).toBe(true);
    expect(preferencesSchema.safeParse({ studyGoalHours: 12 }).success).toBe(true);
    expect(preferencesSchema.safeParse({ studyGoalHours: 0 }).success).toBe(false);
    expect(preferencesSchema.safeParse({ studyGoalHours: 13 }).success).toBe(false);
    expect(preferencesSchema.safeParse({ studyGoalHours: 2.5 }).success).toBe(false);
  });

  it("bounds the school name length", () => {
    expect(preferencesSchema.safeParse({ schoolName: "x".repeat(120) }).success).toBe(true);
    expect(preferencesSchema.safeParse({ schoolName: "x".repeat(121) }).success).toBe(false);
  });
});

describe("flashcardDeckSchema", () => {
  it("carries the S7-A reference dialog fields: color swatch picker", () => {
    // The reference's Create Deck dialog (measured live) offers a 6-swatch
    // Color picker (violet/blue/emerald/amber/red/pink-500); the deck row's
    // 40px icon block renders the picked color inline.
    const parsed = flashcardDeckSchema.parse({ name: "Biology Chapter 5" });
    expect(parsed.color).toBe("#8b5cf6");
    expect(parsed.description).toBe("");

    const blue = flashcardDeckSchema.parse({ name: "B", color: "#3b82f6" });
    expect(blue.color).toBe("#3b82f6");

    expect(flashcardDeckSchema.safeParse({ name: "B", color: "blue" }).success).toBe(false);
    expect(flashcardDeckSchema.safeParse({ name: "B", color: "#8b5cf" }).success).toBe(false);
    expect(flashcardDeckSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("flashcardSchema", () => {
  it("carries the S7-A reference card field: difficulty", () => {
    // The reference's populated card grid renders a difficulty badge
    // (measured "medium" on a live card, bg-yellow-100 text-yellow-700).
    const parsed = flashcardSchema.parse({ front: "Q", back: "A" });
    expect(parsed.difficulty).toBe("medium");
    expect(parsed.mastered).toBe(false);

    const hard = flashcardSchema.parse({ front: "Q", back: "A", difficulty: "hard" });
    expect(hard.difficulty).toBe("hard");

    expect(flashcardSchema.safeParse({ front: "Q", back: "A", difficulty: "impossible" }).success).toBe(false);
  });
});

describe("practiceTestSchema", () => {
  it("carries the S7-B reference dialog field: questions array", () => {
    // The reference's Create Practice Test dialog (measured) builds a
    // scrollable question list (multiple_choice / true_false / short_answer)
    // via AI Generate; questions persist as a JSON array of {question,type}.
    const parsed = practiceTestSchema.parse({ title: "Bio Review" });
    expect(parsed.questions).toBe("[]");
    expect(parsed.durationMinutes).toBe(60);

    const full = practiceTestSchema.parse({
      title: "Bio Review",
      durationMinutes: 45,
      questions: '[{"question":"What is DNA?","type":"short_answer"}]',
    });
    expect(full.questions).toBe('[{"question":"What is DNA?","type":"short_answer"}]');

    expect(practiceTestSchema.safeParse({ title: "T", questions: "not-json" }).success).toBe(false);
    expect(practiceTestSchema.safeParse({ title: "T", questions: '[{"question":"Q","type":"essay"}]' }).success).toBe(false);
  });
});

describe("aiChatSchema", () => {
  it("requires 1..40 well-formed messages", () => {
    expect(
      aiChatSchema.safeParse({ messages: [{ role: "user", content: "hi" }] }).success,
    ).toBe(true);
    expect(aiChatSchema.safeParse({ messages: [] }).success).toBe(false);
    expect(
      aiChatSchema.safeParse({ messages: [{ role: "system", content: "hi" }] }).success,
    ).toBe(false);
    expect(
      aiChatSchema.safeParse({ messages: [{ role: "user", content: "" }] }).success,
    ).toBe(false);
  });
});

describe("mathSolveSchema", () => {
  it("accepts text problems and validates base64 data URLs", () => {
    expect(mathSolveSchema.safeParse({ problem: "2x + 5 = 15" }).success).toBe(true);
    expect(
      mathSolveSchema.safeParse({ problem: "x", image: "data:image/png;base64,AAAA" }).success,
    ).toBe(true);
    expect(
      mathSolveSchema.safeParse({ problem: "x", image: "https://example.com/x.png" }).success,
    ).toBe(false);
    expect(mathSolveSchema.safeParse({ problem: "" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// S15 — the auth-flow depth schemas: verify-email (6-digit OTP), forgot
// password, reset password (48-hex token). registerSchema is UNCHANGED (the
// signup form just stops sending a name; the default "" covers it).
// ---------------------------------------------------------------------------

describe("verifyEmailSchema (S15)", () => {
  it("accepts a valid email + 6-digit code", () => {
    expect(
      verifyEmailSchema.safeParse({ email: "demo@studyflow.app", code: "012345" }).success,
    ).toBe(true);
    expect(
      verifyEmailSchema.safeParse({ email: "a@b.co", code: "999999" }).success,
    ).toBe(true);
  });

  it("rejects wrong-length, non-digit, and malformed codes", () => {
    expect(verifyEmailSchema.safeParse({ email: "a@b.co", code: "12345" }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ email: "a@b.co", code: "1234567" }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ email: "a@b.co", code: "12a456" }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ email: "a@b.co", code: 123456 }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ email: "not-an-email", code: "123456" }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ code: "123456" }).success).toBe(false);
  });
});

describe("forgotPasswordSchema (S15)", () => {
  it("accepts any well-formed email (the route answers uniformly)", () => {
    expect(forgotPasswordSchema.safeParse({ email: "demo@studyflow.app" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "stranger@example.com" }).success).toBe(true);
  });

  it("rejects malformed emails and missing bodies", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({}).success).toBe(false);
    // Unknown keys are stripped (the repo-wide Zod convention — strip mode).
    expect(forgotPasswordSchema.safeParse({ email: "a@b.co", extra: 1 }).success).toBe(true);
  });
});

describe("resetPasswordSchema (S15)", () => {
  it("accepts a 48-hex token with a strong-enough password", () => {
    const token = "a".repeat(48);
    expect(
      resetPasswordSchema.safeParse({ token, password: "NewPass1234!" }).success,
    ).toBe(true);
  });

  it("rejects short/weak passwords and malformed tokens", () => {
    const token = "a".repeat(48);
    expect(resetPasswordSchema.safeParse({ token, password: "short" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "XYZ!", password: "NewPass1234!" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "a".repeat(47), password: "NewPass1234!" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: "NewPass1234!" }).success).toBe(false);
  });
});

describe("rumEventSchema (S18 — the RUM hook)", () => {
  it("accepts each web-vitals metric with a rating and navigation type", () => {
    for (const metric of ["TTFB", "FCP", "LCP", "CLS", "INP"] as const) {
      const r = rumEventSchema.safeParse({
        metric,
        value: 123.4,
        rating: "good",
        navigationType: "navigate",
        path: "/",
        sessionId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
      });
      expect(r.success).toBe(true);
    }
  });

  it("accepts every rating and navigationType the library emits", () => {
    for (const rating of ["good", "needs-improvement", "poor"] as const) {
      expect(
        rumEventSchema.safeParse({ metric: "LCP", value: 1, rating, navigationType: "reload" }).success,
      ).toBe(true);
    }
    for (const navigationType of [
      "navigate",
      "reload",
      "back-forward",
      "back-forward-cache",
      "prerender",
      "restore",
      "soft-navigation",
    ] as const) {
      expect(
        rumEventSchema.safeParse({ metric: "CLS", value: 0, rating: "good", navigationType }).success,
      ).toBe(true);
    }
  });

  it("rejects unknown metrics, negative values, and unknown ratings", () => {
    const base = { metric: "LCP", value: 100, rating: "good", navigationType: "navigate" };
    expect(rumEventSchema.safeParse({ ...base, metric: "SI" }).success).toBe(false);
    expect(rumEventSchema.safeParse({ ...base, value: -1 }).success).toBe(false);
    expect(rumEventSchema.safeParse({ ...base, rating: "excellent" }).success).toBe(false);
    expect(rumEventSchema.safeParse({ ...base, navigationType: "unknown" }).success).toBe(false);
  });

  it("bounds the path and userAgent strings (the store stays tidy)", () => {
    const base = { metric: "FCP", value: 50, rating: "good", navigationType: "navigate" };
    expect(rumEventSchema.safeParse({ ...base, path: "x".repeat(201) }).success).toBe(false);
    expect(rumEventSchema.safeParse({ ...base, path: "/".repeat(200) }).success).toBe(true);
    expect(rumEventSchema.safeParse({ ...base, userAgent: "u".repeat(301) }).success).toBe(false);
    // The sessionId is bounded on the BATCH schema (one per POST body).
    expect(rumBatchSchema.safeParse({ sessionId: "s".repeat(101), events: [{ ...base }] }).success).toBe(false);
    expect(rumBatchSchema.safeParse({ sessionId: "s".repeat(100), events: [{ ...base }] }).success).toBe(true);
  });
});

describe("changePasswordSchema (S24 — the account-security rotation)", () => {
  it("accepts a valid differing pair", () => {
    expect(
      changePasswordSchema.safeParse({ currentPassword: "Demo1234!", newPassword: "NewPass5678!" }).success,
    ).toBe(true);
  });

  it("applies the register family's policy to BOTH fields (min 8 / max 200)", () => {
    expect(
      changePasswordSchema.safeParse({ currentPassword: "short", newPassword: "NewPass5678!" }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({ currentPassword: "Demo1234!", newPassword: "short" }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({ currentPassword: "a".repeat(201), newPassword: "NewPass5678!" }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({ currentPassword: "Demo1234!", newPassword: "a".repeat(201) }).success,
    ).toBe(false);
    expect(changePasswordSchema.safeParse({ currentPassword: "Demo1234!" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({}).success).toBe(false);
  });

  it("rejects the same-password pair with the actionable copy (the refine rule)", () => {
    const r = changePasswordSchema.safeParse({ currentPassword: "Demo1234!", newPassword: "Demo1234!" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe(
        "The new password must be different from your current password.",
      );
    }
  });

  it("strips unknown keys (the repo-wide Zod convention — strip mode)", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "Demo1234!",
      newPassword: "NewPass5678!",
      email: "attacker@evil.test",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).not.toHaveProperty("email");
    }
  });
});

describe("rumBatchSchema (S18 — the beacon POST body)", () => {
  const event = {
    metric: "TTFB",
    value: 42,
    rating: "good",
    navigationType: "navigate",
    path: "/",
  };

  it("accepts a sessionId with up to 10 events", () => {
    const r = rumBatchSchema.safeParse({
      sessionId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      events: [{ ...event }, { ...event, metric: "FCP", value: 90 }],
    });
    expect(r.success).toBe(true);
    expect(rumBatchSchema.safeParse({ sessionId: "abc", events: Array(10).fill(event) }).success).toBe(true);
  });

  it("rejects a missing sessionId, an empty batch, and >10 events", () => {
    expect(rumBatchSchema.safeParse({ events: [event] }).success).toBe(false);
    expect(rumBatchSchema.safeParse({ sessionId: "abc", events: [] }).success).toBe(false);
    expect(rumBatchSchema.safeParse({ sessionId: "abc", events: Array(11).fill(event) }).success).toBe(false);
  });

  it("rejects an invalid event inside the batch (per-item validation)", () => {
    expect(
      rumBatchSchema.safeParse({ sessionId: "abc", events: [{ ...event, metric: "NOPE" }] }).success,
    ).toBe(false);
  });
});

describe("deleteAccountSchema (S25 — the ownership exit)", () => {
  it("accepts a valid password + typed DELETE confirmation", () => {
    expect(deleteAccountSchema.safeParse({ password: "Demo1234!", confirmation: "DELETE" }).success).toBe(true);
  });

  it("applies the register family's password policy (min 8 / max 200)", () => {
    expect(deleteAccountSchema.safeParse({ password: "short", confirmation: "DELETE" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ password: "a".repeat(201), confirmation: "DELETE" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ confirmation: "DELETE" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a wrong confirmation word with the actionable copy (the refine rule — case-exact)", () => {
    for (const bad of ["delete", "REMOVE", "", "DELETE ", "confirm"]) {
      const r = deleteAccountSchema.safeParse({ password: "Demo1234!", confirmation: bad });
      expect(r.success, `confirmation "${bad}" should fail`).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0].message).toBe("Type DELETE to confirm.");
      }
    }
  });

  it("strips unknown keys (the repo-wide Zod convention — strip mode)", () => {
    const r = deleteAccountSchema.safeParse({
      password: "Demo1234!",
      confirmation: "DELETE",
      email: "attacker@evil.test",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).not.toHaveProperty("email");
    }
  });
});

describe("changeEmailSchema (S26 — the account-identity rotation)", () => {
  it("accepts a valid triple (password + matching emails)", () => {
    expect(
      changeEmailSchema.safeParse({
        password: "Demo1234!",
        newEmail: "student@example.com",
        confirmEmail: "student@example.com",
      }).success,
    ).toBe(true);
  });

  it("applies the register family's policy (password min 8 / max 200; email max 200)", () => {
    expect(
      changeEmailSchema.safeParse({
        password: "short",
        newEmail: "student@example.com",
        confirmEmail: "student@example.com",
      }).success,
    ).toBe(false);
    expect(
      changeEmailSchema.safeParse({
        password: "a".repeat(201),
        newEmail: "student@example.com",
        confirmEmail: "student@example.com",
      }).success,
    ).toBe(false);
    expect(changeEmailSchema.safeParse({ newEmail: "student@example.com", confirmEmail: "student@example.com" }).success).toBe(
      false,
    );
    expect(changeEmailSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a malformed new email (the email field's own shape)", () => {
    for (const bad of ["not-an-email", "missing@tld", "a".repeat(200) + "@x.test", ""]) {
      const r = changeEmailSchema.safeParse({
        password: "Demo1234!",
        newEmail: bad,
        confirmEmail: bad,
      });
      expect(r.success, `newEmail "${bad.slice(0, 30)}" should fail`).toBe(false);
    }
  });

  it("rejects the mismatched confirm with the actionable copy (the refine rule)", () => {
    const r = changeEmailSchema.safeParse({
      password: "Demo1234!",
      newEmail: "student@example.com",
      confirmEmail: "student@typo.example",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe("The email addresses do not match.");
    }
  });

  it("strips unknown keys (the repo-wide Zod convention — strip mode)", () => {
    const r = changeEmailSchema.safeParse({
      password: "Demo1234!",
      newEmail: "student@example.com",
      confirmEmail: "student@example.com",
      userId: "attacker-injection",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).not.toHaveProperty("userId");
    }
  });
});
