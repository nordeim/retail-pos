// S21 — the data-export seam (docs/remediation-plan-session21.md).
//
// The full-data export ("own your data" portability): the envelope is
// built by a PURE function so the unit layer can pin it end-to-end — the
// format identity (version + format string), the stable collection
// manifest (every key always present, empty → [] + count 0), the row
// normalizer (userId dropped, Date → ISO, ids/FKs passed through), and
// the SECRET GUARD (passwordHash can never ride the export).
import { describe, expect, it } from "vitest";
import {
  DATA_EXPORT_FORMAT,
  DATA_EXPORT_VERSION,
  EXPORT_COLLECTIONS,
  buildDataExport,
  serializeExportRow,
} from "../src/lib/data-export";

const WHEN = new Date("2026-10-09T08:00:00.000Z");

describe("EXPORT_COLLECTIONS (the manifest contract)", () => {
  it("declares the 20 content collections in the stable export order", () => {
    expect(EXPORT_COLLECTIONS).toEqual([
      "subjects",
      "taskLists",
      "tasks",
      "assignments",
      "exams",
      "events",
      "timetableClasses",
      "notebooks",
      "notes",
      "decks",
      "cards",
      "practiceTests",
      "studyGroups",
      "grades",
      "focusSessions",
      "folders",
      "files",
      "chatMessages",
      "calcHistory",
      "holidays",
    ]);
  });

  it("never includes the excluded families (tokens, telemetry, the user table)", () => {
    // ADR-019: VerificationToken / PasswordResetToken (secrets),
    // RumEvent (re-collectable telemetry — the RUM CSV covers it), and
    // the User (it rides the envelope's `user` field, hashless) are NOT
    // collections.
    expect(EXPORT_COLLECTIONS).not.toContain("verificationTokens");
    expect(EXPORT_COLLECTIONS).not.toContain("passwordResetTokens");
    expect(EXPORT_COLLECTIONS).not.toContain("rumEvents");
    expect(EXPORT_COLLECTIONS).not.toContain("user");
  });
});

describe("serializeExportRow (the row normalizer)", () => {
  it("drops userId (single-user implied) and passes content fields through", () => {
    const row = serializeExportRow({
      id: "task-1",
      userId: "user-1",
      title: "Read chapter 4 — vectors",
      completed: false,
      priority: "none",
    });
    expect(row).toEqual({
      id: "task-1",
      title: "Read chapter 4 — vectors",
      completed: false,
      priority: "none",
    });
  });

  it("converts Date values to ISO strings (createdAt, dueDate, …)", () => {
    const row = serializeExportRow({
      id: "task-2",
      userId: "user-1",
      dueDate: WHEN,
      createdAt: WHEN,
    });
    expect(row.dueDate).toBe("2026-10-09T08:00:00.000Z");
    expect(row.createdAt).toBe("2026-10-09T08:00:00.000Z");
  });

  it("keeps foreign-key fields and null dates intact (cross-referencing)", () => {
    const row = serializeExportRow({
      id: "task-3",
      listId: null,
      subjectId: "subject-9",
      dueDate: null,
      updatedAt: WHEN,
    });
    expect(row.listId).toBeNull();
    expect(row.subjectId).toBe("subject-9");
    expect(row.dueDate).toBeNull();
    expect(row.updatedAt).toBe("2026-10-09T08:00:00.000Z");
  });
});

describe("buildDataExport (the envelope builder)", () => {
  const user = {
    id: "user-1",
    email: "demo@studyflow.app",
    name: "Demo Student",
    avatarEmoji: "🎓",
    themeMode: "system",
    accentColor: "violet",
    emailVerified: true,
    schoolName: "",
    gradeLevel: "",
    studyGoalHours: 4,
    notificationsEnabled: true,
    createdAt: WHEN,
    updatedAt: WHEN,
  };

  it("builds the versioned envelope (format, version, exportedAt, user)", () => {
    const envelope = buildDataExport(user, {}, WHEN);
    expect(envelope.format).toBe(DATA_EXPORT_FORMAT);
    expect(envelope.format).toBe("studyflow-data-export");
    expect(envelope.version).toBe(DATA_EXPORT_VERSION);
    expect(envelope.version).toBe(1);
    expect(envelope.exportedAt).toBe("2026-10-09T08:00:00.000Z");
    expect(envelope.user.email).toBe("demo@studyflow.app");
    expect(envelope.user.studyGoalHours).toBe(4);
  });

  it("presents EVERY manifest collection key — empty input yields [] + count 0", () => {
    const envelope = buildDataExport(user, {}, WHEN);
    expect(Object.keys(envelope.data)).toEqual(EXPORT_COLLECTIONS);
    expect(Object.keys(envelope.counts)).toEqual(EXPORT_COLLECTIONS);
    for (const name of EXPORT_COLLECTIONS) {
      expect(envelope.data[name]).toEqual([]);
      expect(envelope.counts[name]).toBe(0);
    }
  });

  it("serializes the rows (userId dropped, dates ISO) and counts them", () => {
    const envelope = buildDataExport(
      user,
      {
        tasks: [
          { id: "task-1", userId: "user-1", title: "Read chapter 4 — vectors", createdAt: WHEN },
          { id: "task-2", userId: "user-1", title: "Lab report: pendulum experiment", createdAt: WHEN },
        ],
        subjects: [{ id: "subject-1", userId: "user-1", name: "Mathematics", color: "#8b5cf6", createdAt: WHEN }],
      },
      WHEN,
    );
    expect(envelope.data.tasks).toEqual([
      { id: "task-1", title: "Read chapter 4 — vectors", createdAt: "2026-10-09T08:00:00.000Z" },
      { id: "task-2", title: "Lab report: pendulum experiment", createdAt: "2026-10-09T08:00:00.000Z" },
    ]);
    expect(envelope.data.subjects).toEqual([
      { id: "subject-1", name: "Mathematics", color: "#8b5cf6", createdAt: "2026-10-09T08:00:00.000Z" },
    ]);
    expect(envelope.counts.tasks).toBe(2);
    expect(envelope.counts.subjects).toBe(1);
    // Untouched collections stay present (empty + zero).
    expect(envelope.counts.holidays).toBe(0);
    expect(envelope.data.holidays).toEqual([]);
  });

  it("THE SECRET GUARD: passwordHash can never ride the export", () => {
    // The user row is fed WITH a hash (the route must never select it,
    // and the seam must never leak it if one slips through anyway).
    const leakyUser = { ...user, passwordHash: "scrypt:deadbeef" };
    const envelope = buildDataExport(
      leakyUser,
      {
        tasks: [{ id: "task-1", userId: "user-1", title: "x", passwordHash: "scrypt:cafebabe", createdAt: WHEN }],
      },
      WHEN,
    );
    const json = JSON.stringify(envelope);
    expect(json).not.toContain("passwordHash");
    expect(json).not.toContain("scrypt:");
    expect(json).not.toContain("deadbeef");
    expect(json).not.toContain("cafebabe");
  });
});
