// Session-77 probe v1 (Batch AD recon + measure): the two remaining
// unmeasured populated surfaces — the Notes inline editor and the
// Flashcards study mode. Discovery-first: entity recon, drive the ref's
// own UI, computed-style measure, screenshots, residue-zero cleanup.
// NEVER touches pre-existing user data (cleanup matches /probe.*s77/i).
// Usage: node scripts/ref-ad-probe-s77.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const REF = "https://omni-study1.base44.app";
const SHOTS = "docs/screenshots";
mkdirSync(SHOTS, { recursive: true });
const j = (o) => JSON.stringify(o);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const api = (method, path, body) =>
  page.evaluate(async ({ method, path, body }) => {
    let token = null;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k);
      if (v && v.startsWith("eyJ")) { token = v; break; }
    }
    const r = await fetch(`/api/apps/6969efea366cba53524cde3f${path}`, {
      method, credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let parsed = null;
    try { parsed = await r.json(); } catch {}
    return { status: r.status, body: parsed };
  }, { method, path, body });

const visit = async (navText) => {
  for (let i = 0; i < 2; i++) {
    const openDlg = await page.locator("[role=dialog]").count();
    if (openDlg === 0) break;
    await page.keyboard.press("Escape");
    await page.waitForTimeout(900);
  }
  await page.locator("a").filter({ hasText: navText }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2200);
};

const shot = (name) => page.screenshot({ path: `${SHOTS}/77-ref-${name}.png`, fullPage: false }).catch(() => {});

try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);
  console.log("LOGIN: ok");

  // ---- P0. entity recon — discover the Notes/Flashcards entity names ----
  const ENT = ["Notebook", "Note", "Flashcard", "FlashcardSet", "FlashcardDeck", "Deck", "Card"];
  const recon = {};
  for (const e of ENT) {
    const r = await api("GET", `/entities/${e}`);
    const rows = Array.isArray(r?.body) ? r.body : (Array.isArray(r?.body?.data) ? r.body.data : null);
    recon[e] = rows === null ? `status:${r.status}` : `count:${rows.length}`;
    if (rows && rows.length > 0) {
      console.log(`RECON ${e}: count=${rows.length} FIELDS=${j(Object.keys(rows[0]).slice(0, 16))}`);
      console.log(`RECON ${e} SAMPLE: ${j(rows[0]).slice(0, 500)}`);
    }
  }
  console.log("RECON-SUMMARY:", j(recon));

  // ---- P1. Notes: drive the ref's own editor flow ----
  await visit("Notes");
  await shot("notes-zero");
  const noteBtn = page.locator("main button", { hasText: /new note|new$/i }).first();
  const hasBtn = (await noteBtn.count()) > 0;
  console.log("P1-notes: new-button-present:", hasBtn, await noteBtn.textContent().catch(() => "?"));
  if (hasBtn) {
    await noteBtn.click();
    await page.waitForTimeout(1800);
    await shot("notes-editor-open");
    // dump the editor structure: inputs, textareas, contenteditables, buttons
    const editorDump = await page.evaluate(() => {
      const out = { inputs: [], textareas: [], editables: [], buttons: [], headings: [] };
      for (const el of document.querySelectorAll("main input")) {
        const s = getComputedStyle(el);
        out.inputs.push({
          placeholder: el.getAttribute("placeholder"),
          aria: el.getAttribute("aria-label"),
          fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color,
          border: s.border, bg: s.backgroundColor, h: Math.round(el.getBoundingClientRect().height),
        });
      }
      for (const el of document.querySelectorAll("main textarea")) {
        const s = getComputedStyle(el);
        out.textareas.push({
          placeholder: el.getAttribute("placeholder"), aria: el.getAttribute("aria-label"),
          fontSize: s.fontSize, lineHeight: s.lineHeight, color: s.color, bg: s.backgroundColor,
          h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width),
        });
      }
      for (const el of document.querySelectorAll("main [contenteditable=true]")) {
        const s = getComputedStyle(el);
        out.editables.push({
          cls: (el.className || "").toString().slice(0, 120),
          fontSize: s.fontSize, color: s.color, bg: s.backgroundColor,
          h: Math.round(el.getBoundingClientRect().height),
        });
      }
      for (const b of [...document.querySelectorAll("main button")].slice(0, 18)) {
        out.buttons.push((b.textContent || "").trim().slice(0, 30) || b.getAttribute("aria-label") || "(icon)");
      }
      for (const h of document.querySelectorAll("main h1, main h2, main h3")) {
        const s = getComputedStyle(h);
        out.headings.push({ tag: h.tagName, text: (h.textContent || "").trim().slice(0, 40), fontSize: s.fontSize, weight: s.fontWeight });
      }
      return out;
    });
    console.log("P1-EDITOR-DUMP:", j(editorDump));

    // try to type a title + content through whatever editor inputs exist
    const tInp = page.locator("main input").first();
    if ((await tInp.count()) > 0) {
      await tInp.fill("Probe note s77");
      await page.waitForTimeout(600);
    }
    const ta = page.locator("main textarea").first();
    if ((await ta.count()) > 0) {
      await ta.fill("Probe content line one.\nLine two.");
      await page.waitForTimeout(600);
    } else {
      const ce = page.locator("main [contenteditable=true]").first();
      if ((await ce.count()) > 0) { await ce.click(); await page.keyboard.type("Probe content line one."); await page.waitForTimeout(600); }
    }
    await shot("notes-editor-filled");
    // does it autosave? wait then check entity state
    await page.waitForTimeout(2500);
    const noteState = await api("GET", "/entities/Note");
    const noteRows = Array.isArray(noteState?.body) ? noteState.body : [];
    console.log("P1-notes-entity-after-type:", j({ count: noteRows.length, titles: noteRows.map((r) => r.title ?? r.name ?? "?").slice(0, 8) }));
    const nbState = await api("GET", "/entities/Notebook");
    const nbRows = Array.isArray(nbState?.body) ? nbState.body : [];
    console.log("P1-notebook-entity:", j({ count: nbRows.length, names: nbRows.map((r) => r.name ?? r.title ?? "?").slice(0, 8) }));
  }

  // ---- P2. Flashcards: existing decks + study mode ----
  await visit("Flashcards");
  await shot("flashcards");
  const fcDump = await page.evaluate(() => {
    const out = { headings: [], buttons: [], text: [] };
    for (const h of document.querySelectorAll("main h1, main h2, main h3")) {
      out.headings.push({ tag: h.tagName, text: (h.textContent || "").trim().slice(0, 50) });
    }
    for (const b of [...document.querySelectorAll("main button")].slice(0, 20)) {
      out.buttons.push((b.textContent || "").trim().slice(0, 30) || b.getAttribute("aria-label") || "(icon)");
    }
    out.text = (document.querySelector("main")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 600);
    return out;
  });
  console.log("P2-FLASHCARDS-DUMP:", j(fcDump));

  // try entering study mode on an existing deck
  const studyBtn = page.locator("main button", { hasText: /study|start/i }).first();
  if ((await studyBtn.count()) > 0) {
    console.log("P2-study-button:", (await studyBtn.textContent().catch(() => "?") || "").trim());
    await studyBtn.click();
    await page.waitForTimeout(1800);
    await shot("flashcards-study");
    const studyDump = await page.evaluate(() => {
      const dlg = document.querySelector("[role=dialog], [data-state=open].fixed, .fixed.inset-0") || document.body;
      const out = { role: dlg.getAttribute?.("role") ?? null, ariaLabel: dlg.getAttribute?.("aria-label") ?? null, nodes: [] };
      for (const el of dlg.querySelectorAll("button, h1, h2, h3, p, span, div[class*=text-]")) {
        if (!el.offsetParent && el.tagName !== "BODY") continue;
        const txt = (el.textContent || "").trim();
        if (!txt || txt.length > 80) continue;
        const s = getComputedStyle(el);
        out.nodes.push({
          tag: el.tagName, text: txt.slice(0, 40), cls: (el.className || "").toString().slice(0, 60),
          fontSize: s.fontSize, weight: s.fontWeight, color: s.color, bg: s.backgroundColor,
        });
        if (out.nodes.length > 24) break;
      }
      const overlay = document.querySelector("[class*=bg-black], [style*=rgba(0");
      if (overlay) { const s = getComputedStyle(overlay); out.overlay = { bg: s.backgroundColor, z: s.zIndex, pos: s.position }; }
      return out;
    });
    console.log("P2-STUDY-DUMP:", j(studyDump));
    // try the flip
    const flipTarget = page.locator("[role=dialog] [class*=cursor-pointer], [role=dialog] div[class*=rounded]").first();
    if ((await flipTarget.count()) > 0) {
      await flipTarget.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(900);
      await shot("flashcards-study-flipped");
    }
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(900);
  } else {
    console.log("P2-study-button: NOT FOUND (no deck with cards?)");
  }

  // ---- cleanup: every entity this session could have written (AP-118) ----
  const CLEAN = ["Note", "Notebook", "Flashcard", "FlashcardSet", "FlashcardDeck", "Deck", "Card"];
  const dels = [];
  for (const e of CLEAN) {
    const list = await api("GET", `/entities/${e}`);
    const rows = Array.isArray(list?.body) ? list.body : [];
    for (const row of rows) {
      const blob = j(row);
      if (/probe.*s77/i.test(blob)) {
        const id = row.id ?? row.data?.id;
        const r = await api("DELETE", `/entities/${e}/${id}`);
        dels.push(`${e}:${(row.title ?? row.name ?? row.front ?? "?").toString().slice(0, 24)}=${r.status}`);
      }
    }
  }
  console.log("DELETIONS:", j(dels));
  // FINAL-RESIDUE cross-check (count vs deletions)
  let residue = 0;
  for (const e of CLEAN) {
    const list = await api("GET", `/entities/${e}`);
    const rows = Array.isArray(list?.body) ? list.body : [];
    for (const row of rows) { if (/probe.*s77/i.test(j(row))) residue++; }
  }
  console.log("FINAL-RESIDUE:", residue);
} catch (e) {
  console.log("FATAL:", String(e).slice(0, 400));
} finally {
  await browser.close();
}
