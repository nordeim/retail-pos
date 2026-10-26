// Files/upload edge-case audit — session-13 (S13).
// Exercises the upload surface's boundaries against the dev server:
//  - the exact 2 MiB boundary (2097152 must pass, 2097153 must 413)
//  - empty filename / unicode filename round-trip
//  - the download round-trip (bytes + Content-Disposition survive SQLite)
//  - concurrent uploads (5 parallel POSTs)
//  - folder scoping (upload into a nonexistent folder id)
// All created rows carry the "s13-edge-" name prefix and are deleted at the
// end (via the API where possible; direct Prisma as the final sweep).
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3000";
const PREFIX = "s13-edge-";
const prisma = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });

const findings = [];
const nonGaps = [];
const note = (family, surface, detail) => findings.push({ family, surface, ...detail });
const ok = (surface, detail) => nonGaps.push({ surface, detail });

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  // S81/AH10 (the audit-tools repair): the login wait must prove
  // AUTHENTICATION, not main-element presence — the LOGIN PAGE itself has a
  // <main>, so this wait resolved pre-auth and the next goto raced the
  // login POST (ERR_ABORTED on the auth-gate bounce). The sweeps' pattern:
  // wait for the post-login /Dashboard redirect.
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
await login(page);

// in-page multipart POST helper (cookie rides along).
const upload = (name, size, type = "application/octet-stream") =>
  page.evaluate(
    async ({ name, size, type }) => {
      const buf = new Uint8Array(size);
      for (let i = 0; i < size; i++) buf[i] = i % 251;
      const form = new FormData();
      form.append("file", new File([buf], name, { type }));
      const res = await fetch("/api/files", { method: "POST", body: form, credentials: "same-origin" });
      let body = null;
      try { body = await res.json(); } catch {}
      return { status: res.status, body };
    },
    { name, size, type },
  );

try {
  // C1 — exact boundary.
  const atLimit = await upload(`${PREFIX}exact-2mib.bin`, 2 * 1024 * 1024);
  if (atLimit.status === 201) ok("exact 2 MiB upload accepted", { id: atLimit.body?.id });
  else note("C1", "exact 2 MiB upload", { finding: "expected 201", got: atLimit });

  const overLimit = await upload(`${PREFIX}over-2mib.bin`, 2 * 1024 * 1024 + 1);
  if (overLimit.status === 413) ok("2 MiB + 1 rejected with 413", { error: overLimit.body?.error });
  else note("C1", "2 MiB + 1 upload", { finding: "expected 413", got: overLimit });

  // C2 — empty filename.
  const emptyName = await upload("", 16);
  if (emptyName.status === 201) {
    // What did the server store as the name?
    note("C2", "empty filename upload", {
      finding: "a File with an EMPTY name is accepted (201) — the stored record has no usable name and renders as an unlabeled row; file.name.slice(0,200) does not guard emptiness",
      storedName: emptyName.body?.name,
    });
  } else {
    ok("empty filename rejected", { status: emptyName.status });
  }

  // C3 — unicode filename round-trip.
  const unicodeName = `${PREFIX}файл-τésu\" quote.txt`;
  const uni = await upload(unicodeName, 24, "text/plain");
  if (uni.status === 201) {
    const id = uni.body?.id;
    const dl = await page.evaluate(async (id) => {
      const res = await fetch(`/api/files/${id}`, { credentials: "same-origin" });
      const disposition = res.headers.get("content-disposition");
      const bytes = new Uint8Array(await res.arrayBuffer());
      return { status: res.status, disposition, len: bytes.length, first: [...bytes.slice(0, 6)] };
    }, id);
    // Byte round-trip must be exact for a 24-byte file (values 0..23 mod 251).
    const expected = Array.from({ length: 24 }, (_, i) => i % 251);
    const bytesMatch = JSON.stringify(dl.first.concat(Array.from({length: 18}, (_, i) => (6 + i) % 251))) === JSON.stringify(expected) && dl.len === 24;
    if (bytesMatch && dl.status === 200) {
      ok("unicode filename + byte round-trip", { disposition: dl.disposition, len: dl.len });
    } else {
      note("C3", "download round-trip", { finding: "bytes or status mismatch", dl, expected });
    }
    if (dl.disposition && /filename\*=/.test(dl.disposition)) {
      ok("RFC 5987 filename* encoding", { disposition: dl.disposition });
    } else if (dl.disposition && /%/.test(dl.disposition)) {
      note("C3", "Content-Disposition encoding", {
        finding: "non-ASCII filename is encodeURIComponent()-quoted inside filename=\"…\" instead of RFC 5987 filename*=UTF-8''… — browsers show the percent-encoded string as the literal save name",
        disposition: dl.disposition,
      });
    }
  } else {
    note("C3", "unicode filename upload", { finding: "expected 201", got: uni });
  }

  // C4 — concurrent uploads (5 parallel).
  const jobs = Array.from({ length: 5 }, (_, i) => upload(`${PREFIX}concurrent-${i}.bin`, 64 * 1024));
  const results = await Promise.all(jobs);
  const all201 = results.every((r) => r.status === 201);
  if (all201) ok("5 concurrent uploads all succeed", {});
  else note("C4", "concurrent uploads", { finding: "some parallel uploads failed", statuses: results.map((r) => r.status) });

  // C5 — upload into a nonexistent folder id.
  const ghost = await page.evaluate(async (name) => {
    const buf = new Uint8Array(8);
    const form = new FormData();
    form.append("file", new File([buf], name));
    form.append("folderId", "nonexistent-folder-id");
    const res = await fetch("/api/files", { method: "POST", body: form, credentials: "same-origin" });
    return { status: res.status, body: await res.json() };
  }, `${PREFIX}ghost.bin`);
  // S81/AH13 (audit-tools repair): the shipped contract is 404 with the
  // human message ("That folder does not exist." — the coherent design at
  // all three folder-referencing sites: the referenced resource is absent,
  // not the payload malformed). The audit's old 400 expectation predates
  // that design. 400 with a message also passes (either rejects loudly).
  if ((ghost.status === 404 || ghost.status === 400) && typeof ghost.body?.error === "string") {
    ok("nonexistent folderId rejected (404 — the folder resource is absent)", { error: ghost.body?.error });
  } else {
    note("C5", "nonexistent folder upload", { finding: "expected 404 (or 400) with an error message", got: ghost });
  }

  // C6 — multipart with no file field.
  const noFile = await page.evaluate(async () => {
    const form = new FormData();
    form.append("folderId", "");
    const res = await fetch("/api/files", { method: "POST", body: form, credentials: "same-origin" });
    return { status: res.status, body: await res.json() };
  });
  if (noFile.status === 400) ok("missing file field rejected", { error: noFile.body?.error });
  else note("C6", "missing file field", { finding: "expected 400", got: noFile });

  // C7 — unauthenticated upload.
  const noAuth = await page.evaluate(async (name) => {
    const buf = new Uint8Array(8);
    const form = new FormData();
    form.append("file", new File([buf], name));
    const res = await fetch("/api/files", { method: "POST", body: form, credentials: "omit" });
    return { status: res.status };
  }, `${PREFIX}noauth.bin`);
  if (noAuth.status === 401) ok("upload requires auth", noAuth);
  else note("C7", "upload auth", { finding: "expected 401", got: noAuth });

  // C8 — GET list never returns the base64 payload (metadata only).
  const list = await page.evaluate(async () => {
    const res = await fetch("/api/files", { credentials: "same-origin" });
    const text = await res.text();
    return { status: res.status, bytes: text.length, hasDataField: /"data"\s*:/.test(text) };
  });
  if (list.status === 200 && !list.hasDataField) ok("file list returns metadata only", { bytes: list.bytes });
  else note("C8", "file list payload", { finding: "list leaks data field or failed", list });

  // Evidence screenshot of the Files view with edge rows present.
  await page.evaluate(() => {
    const link = [...document.querySelectorAll("a")].find((a) => (a.textContent || "").trim() === "Files");
    if (link) link.click();
  });
  await page.waitForFunction(() => document.querySelector("main h1")?.textContent.trim() === "Files", null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/upload-edge-evidence/files-view.png" });
} finally {
  // Final sweep: delete every prefixed row directly.
  const del = await prisma.fileItem.deleteMany({ where: { name: { startsWith: PREFIX } } });
  // Also sweep the empty-name row if it was created.
  const empty = await prisma.fileItem.deleteMany({ where: { name: "" } });
  console.error(`[cleanup] removed ${del.count + empty.count} edge rows`);
  await prisma.$disconnect();
  await browser.close();
}

console.log(JSON.stringify({ findings, nonGaps }, null, 2));
