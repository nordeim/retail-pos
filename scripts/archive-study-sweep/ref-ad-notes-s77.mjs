// Session-77 probe v2 (Batch AD — Notes deep measure): visibility-scoped
// computed-style measurement of the ref's Notes editor pane (AP-111/115:
// parent chains + visible nodes only), the full save flow driven through
// the ref's own UI, the Quill toolbar functionality check, and the
// populated list-row anatomy. Cleans to residue zero.
// Usage: node scripts/ref-ad-notes-s77.mjs
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

const styleOf = (el) => {
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    tag: el.tagName, cls: (el.className || "").toString().slice(0, 80),
    text: (el.textContent || "").trim().slice(0, 36),
    fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color,
    bg: s.backgroundColor, border: s.borderTopColor && s.borderTopWidth !== "0px" ? `${s.borderTopWidth} ${s.borderTopColor}` : "none",
    radius: s.borderRadius, w: Math.round(r.width), h: Math.round(r.height),
  };
};

try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);

  await visit("Notes");
  // open the editor through the ref's own flow
  await page.locator("main button", { hasText: /new note/i }).first().click();
  await page.waitForTimeout(1800);

  // ---- the editor pane: full structure walk (visible only) ----
  const editorPane = await page.evaluate(() => {
    const ql = document.querySelector("main .ql-editor");
    if (!ql) return { error: "no ql-editor" };
    // walk the parent chain from the Quill editor to main
    const chain = [];
    let el = ql;
    for (let i = 0; i < 8 && el && el !== document.body; i++) {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      chain.push({
        tag: el.tagName, cls: (el.className || "").toString().slice(0, 70),
        bg: s.backgroundColor, border: s.borderTopWidth !== "0px" ? `${s.borderTopWidth} ${s.borderTopColor}` : "none",
        radius: s.borderRadius, pad: s.padding, w: Math.round(r.width), h: Math.round(r.height),
        display: s.display, gap: s.gap,
      });
      el = el.parentElement;
    }
    // the Quill toolbar structure
    const toolbar = document.querySelector("main .ql-toolbar");
    const tb = toolbar ? {
      cls: (toolbar.className || "").toString().slice(0, 80),
      bg: getComputedStyle(toolbar).backgroundColor,
      border: getComputedStyle(toolbar).borderTopColor,
      pad: getComputedStyle(toolbar).padding,
      controls: [...toolbar.querySelectorAll(".ql-toolbar .ql-picker-label, button")].slice(0, 22).map((b) => ({
        label: (b.textContent || "").trim().slice(0, 16),
        cls: (b.className || "").toString().slice(0, 40),
        w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height),
      })),
    } : null;
    return { chain, toolbar: tb };
  });
  console.log("EDITOR-CHAIN:", j(editorPane));

  // ---- the editor top bar: title input + Save + black buttons ----
  const topBar = await page.evaluate(() => {
    const titleInp = [...document.querySelectorAll("main input")].find((i) => i.offsetParent && /note title/i.test(i.placeholder || ""));
    const out = { title: null, saveBtn: null, blackBtns: [] };
    if (titleInp) {
      const s = getComputedStyle(titleInp);
      const r = titleInp.getBoundingClientRect();
      out.title = { placeholder: titleInp.placeholder, fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color, caret: s.caretColor, bg: s.backgroundColor, border: s.border, h: Math.round(r.height), w: Math.round(r.width) };
      // sibling buttons in the same row
      const row = titleInp.closest("div");
      if (row) {
        out.rowChildren = [...row.querySelectorAll("button, input")].map((b) => ({
          tag: b.tagName, text: (b.textContent || "").trim().slice(0, 20) || b.placeholder || "(icon)",
          bg: getComputedStyle(b).backgroundColor, color: getComputedStyle(b).color,
          h: Math.round(b.getBoundingClientRect().height), w: Math.round(b.getBoundingClientRect().width),
        }));
      }
    }
    for (const b of [...document.querySelectorAll("main button")]) {
      if (!b.offsetParent) continue;
      const t = (b.textContent || "").trim();
      if (/save|attach|divider/i.test(t)) {
        const s = getComputedStyle(b);
        out.blackBtns.push({ text: t.slice(0, 24), bg: s.backgroundColor, color: s.color, radius: s.borderRadius, fontSize: s.fontSize, h: Math.round(b.getBoundingClientRect().height), w: Math.round(b.getBoundingClientRect().width) });
      }
    }
    return out;
  });
  console.log("TOP-BAR:", j(topBar));

  // ---- the Font row + tag row ----
  const fontRow = await page.evaluate(() => {
    const out = { fontLabel: null, pickers: [], tagInput: null };
    for (const el of document.querySelectorAll("main *")) {
      if (!el.offsetParent) continue;
      if ((el.textContent || "").trim() === "Font:" && el.children.length === 0) {
        const s = getComputedStyle(el);
        out.fontLabel = { tag: el.tagName, fontSize: s.fontSize, weight: s.fontWeight, color: s.color };
      }
    }
    for (const p of document.querySelectorAll("main .ql-picker:not(.ql-placeholder)")) {
      if (!p.offsetParent) continue;
      const s = getComputedStyle(p);
      out.pickers.push({ cls: (p.className || "").toString().slice(0, 40), label: (p.textContent || "").trim().slice(0, 20), bg: s.backgroundColor, border: s.border, fontSize: s.fontSize, h: Math.round(p.getBoundingClientRect().height) });
    }
    const tag = [...document.querySelectorAll("main input")].find((i) => i.offsetParent && /add tag/i.test(i.placeholder || ""));
    if (tag) {
      const s = getComputedStyle(tag);
      out.tagInput = { placeholder: tag.placeholder, fontSize: s.fontSize, color: s.color, bg: s.backgroundColor, border: s.border, h: Math.round(tag.getBoundingClientRect().height) };
    }
    return out;
  });
  console.log("FONT-TAG-ROW:", j(fontRow));

  // ---- THE SAVE FLOW: fill title + content, click Save ----
  const titleInp = page.locator('main input[placeholder*="Note title"]').first();
  await titleInp.fill("Probe note s77");
  await page.locator("main .ql-editor").click();
  await page.keyboard.type("Probe paragraph one with bold start.");
  await page.waitForTimeout(400);
  // Quill toolbar functionality: select all + bold
  await page.keyboard.press("Control+a");
  const boldBtn = page.locator("main button.ql-bold, main .ql-toolbar button[value=bold]").first();
  if ((await boldBtn.count()) > 0) { await boldBtn.click(); await page.waitForTimeout(400); }
  await page.screenshot({ path: `${SHOTS}/77-ref-notes-editor-before-save.png` });
  const saveBtn = page.locator("main button", { hasText: /^save$/i }).first();
  await saveBtn.click();
  await page.waitForTimeout(2500);
  const noteState = await api("GET", "/entities/Note");
  const noteRows = Array.isArray(noteState?.body) ? noteState.body : [];
  console.log("AFTER-SAVE-ENTITY:", j({ count: noteRows.length, row: noteRows[0] ? j(noteRows[0]).slice(0, 600) : null }));

  // ---- the populated editor + list row anatomy ----
  await page.screenshot({ path: `${SHOTS}/77-ref-notes-populated.png`, fullPage: false });
  const populated = await page.evaluate(() => {
    const out = {};
    const ql = document.querySelector("main .ql-editor");
    if (ql) {
      out.qlContentHTML = ql.innerHTML.slice(0, 300);
      const s = getComputedStyle(ql);
      out.ql = { fontSize: s.fontSize, color: s.color, lineHeight: s.lineHeight, h: Math.round(ql.getBoundingClientRect().height) };
    }
    const title = [...document.querySelectorAll("main input")].find((i) => i.offsetParent && /note title/i.test(i.placeholder || ""));
    if (title) out.titleValue = title.value;
    // the list row (first note card in the center pane)
    const listBtn = [...document.querySelectorAll("main button, main a")].find((b) => b.offsetParent && /probe note s77/i.test(b.textContent || ""));
    if (listBtn) {
      const s = getComputedStyle(listBtn);
      const r = listBtn.getBoundingClientRect();
      out.listRow = {
        cls: (listBtn.className || "").toString().slice(0, 90),
        bg: s.backgroundColor, border: s.borderTopWidth !== "0px" ? `${s.borderTopWidth} ${s.borderTopColor}` : "none",
        radius: s.borderRadius, pad: s.padding, w: Math.round(r.width), h: Math.round(r.height),
        text: (listBtn.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120),
        children: [...listBtn.querySelectorAll("*")].filter((c) => c.offsetParent && (c.textContent || "").trim()).slice(0, 8).map((c) => {
          const cs = getComputedStyle(c);
          return { tag: c.tagName, text: (c.textContent || "").trim().slice(0, 30), fontSize: cs.fontSize, weight: cs.fontWeight, color: cs.color, truncate: cs.textOverflow };
        }),
      };
    }
    // any tag pill rendered near the editor title?
    out.tagPills = [...document.querySelectorAll("main span, main button")].filter((el) => el.offsetParent && el.children.length === 0 && /^(probe tag|tag)/i.test((el.textContent || "").trim())).slice(0, 4).map((el) => ({ text: (el.textContent || "").trim(), bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color, radius: getComputedStyle(el).borderRadius, fontSize: getComputedStyle(el).fontSize }));
    return out;
  });
  console.log("POPULATED:", j(populated));

  // ---- left pane chrome (h1 + search + filters) ----
  const leftPane = await page.evaluate(() => {
    const h1 = document.querySelector("main h1");
    const out = {};
    if (h1) {
      const s = getComputedStyle(h1);
      out.h1 = { text: (h1.textContent || "").trim(), fontSize: s.fontSize, weight: s.fontWeight, color: s.color };
    }
    const search = [...document.querySelectorAll("main input")].find((i) => i.offsetParent && /search notes/i.test(i.placeholder || ""));
    if (search) {
      const s = getComputedStyle(search);
      out.search = { fontSize: s.fontSize, color: s.color, bg: s.backgroundColor, border: s.border, radius: s.borderRadius, h: Math.round(search.getBoundingClientRect().height) };
    }
    // the notebook/tag filter selects (visible combobox-ish buttons)
    out.filters = [...document.querySelectorAll("main button, main [role=combobox]")].filter((b) => b.offsetParent && /all notebooks|all tags/i.test(b.textContent || "")).slice(0, 4).map((b) => {
      const s = getComputedStyle(b);
      return { text: (b.textContent || "").trim().slice(0, 20), bg: s.backgroundColor, border: s.border, fontSize: s.fontSize, h: Math.round(b.getBoundingClientRect().height), tag: b.tagName };
    });
    return out;
  });
  console.log("LEFT-PANE:", j(leftPane));

  // ---- cleanup (AP-118: every writable entity) ----
  const CLEAN = ["Note", "Notebook"];
  const dels = [];
  for (const e of CLEAN) {
    const list = await api("GET", `/entities/${e}`);
    const rows = Array.isArray(list?.body) ? list.body : [];
    for (const row of rows) {
      if (/probe.*s77/i.test(j(row))) {
        const r = await api("DELETE", `/entities/${e}/${row.id}`);
        dels.push(`${e}:${(row.title ?? "?").toString().slice(0, 20)}=${r.status}`);
      }
    }
  }
  console.log("DELETIONS:", j(dels));
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
