// Session-77 probe v3 (Batch AD — Notes save flow + populated anatomy):
// drives the ref's own editor to completion (title + body + Save), verifies
// the entity contract (content as HTML?), checks the Quill toolbar
// functionality (bold produces <strong>?), measures the populated list row
// + editor, then residue-zero cleanup.
// Usage: node scripts/ref-ad-notes2-s77.mjs
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

try {
  // pre-residue (v2 died before cleanup — typing alone shouldn't persist,
  // but verify)
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);
  const pre = await api("GET", "/entities/Note");
  const preRows = Array.isArray(pre?.body) ? pre.body : [];
  const preProbe = preRows.filter((r) => /probe.*s77/i.test(j(r)));
  if (preProbe.length > 0) {
    for (const row of preProbe) await api("DELETE", `/entities/Note/${row.id}`);
    console.log("PRE-RESIDUE-CLEANED:", preProbe.length);
  } else console.log("PRE-RESIDUE: 0");

  // navigate to Notes + open the editor
  await page.locator("a").filter({ hasText: "Notes" }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2200);
  await page.locator("main button", { hasText: /new note/i }).first().click();
  await page.waitForTimeout(1500);

  // fill title + body
  await page.locator('main input[placeholder*="Note title"]').first().fill("Probe note s77");
  const ql = page.locator("main .ql-editor").first();
  await ql.click();
  await page.keyboard.type("Probe paragraph one.");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second line here.");
  // deselect (press End + click at end) to measure unselected text color
  await page.keyboard.press("Control+Shift+Home");
  await page.waitForTimeout(200);

  // toolbar functionality: bold the selection
  const boldBtn = page.locator("main .ql-toolbar button.ql-bold, main button.ql-bold").first();
  const boldCount = await boldBtn.count();
  if (boldCount > 0) { await boldBtn.click(); await page.waitForTimeout(400); }
  console.log("BOLD-BUTTON-PRESENT:", boldCount > 0);

  // deselect everything: click at the very end of the editor
  await page.keyboard.press("Control+End");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/77-ref-notes-editor-typed.png` });

  // the <p> text color inside ql-editor (AP-115: the text's own style,
  // not the container's) + the strong tag presence
  const typedState = await page.evaluate(() => {
    const qlEl = document.querySelector("main .ql-editor");
    if (!qlEl) return { error: "no editor" };
    const p = qlEl.querySelector("p");
    const strong = qlEl.querySelector("strong");
    const out = {
      innerHTML: qlEl.innerHTML.slice(0, 300),
      hasStrong: !!strong,
      pColor: p ? getComputedStyle(p).color : null,
      pFontSize: p ? getComputedStyle(p).fontSize : null,
      pLineHeight: p ? getComputedStyle(p).lineHeight : null,
      strongColor: strong ? getComputedStyle(strong).color : null,
      strongWeight: strong ? getComputedStyle(strong).fontWeight : null,
      editorColor: getComputedStyle(qlEl).color,
    };
    return out;
  });
  console.log("TYPED-STATE:", j(typedState));

  // click Save (forgiving locator: substring match)
  await page.locator('main button:has-text("Save")').first().click({ timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${SHOTS}/77-ref-notes-after-save.png` });

  const noteState = await api("GET", "/entities/Note");
  const noteRows = Array.isArray(noteState?.body) ? noteState.body : [];
  console.log("AFTER-SAVE-COUNT:", noteRows.length);
  if (noteRows[0]) {
    console.log("NOTE-FIELDS:", j(Object.keys(noteRows[0])));
    console.log("NOTE-ROW:", j(noteRows[0]).slice(0, 800));
  }

  // populated editor + list row anatomy
  const populated = await page.evaluate(() => {
    const out = {};
    const title = [...document.querySelectorAll("main input")].find((i) => i.offsetParent && /note title/i.test(i.placeholder || ""));
    if (title) out.titleValue = title.value;
    const qlEl = document.querySelector("main .ql-editor");
    if (qlEl) {
      out.qlHTML = qlEl.innerHTML.slice(0, 200);
      out.qlColor = getComputedStyle(qlEl).color;
    }
    // the list row in the center pane
    const listRow = [...document.querySelectorAll("main button, main a, main div[class*=cursor]")].find((b) => b.offsetParent && /probe note s77/i.test(b.textContent || ""));
    if (listRow) {
      const s = getComputedStyle(listRow);
      const r = listRow.getBoundingClientRect();
      out.listRow = {
        tag: listRow.tagName, cls: (listRow.className || "").toString().slice(0, 90),
        bg: s.backgroundColor, border: s.borderTopWidth !== "0px" ? `${s.borderTopWidth} ${s.borderTopColor}` : "none",
        radius: s.borderRadius, pad: s.padding, w: Math.round(r.width), h: Math.round(r.height),
        text: (listRow.textContent || "").replace(/\s+/g, " ").trim().slice(0, 140),
        kids: [...listRow.querySelectorAll("*")].filter((c) => c.offsetParent && (c.textContent || "").trim()).slice(0, 10).map((c) => {
          const cs = getComputedStyle(c);
          return { tag: c.tagName, text: (c.textContent || "").trim().slice(0, 34), fontSize: cs.fontSize, weight: cs.fontWeight, color: cs.color, bg: cs.backgroundColor };
        }),
      };
    } else out.listRow = "NOT-FOUND";
    return out;
  });
  console.log("POPULATED:", j(populated));
  await page.screenshot({ path: `${SHOTS}/77-ref-notes-populated.png` });

  // ---- cleanup (AP-118) ----
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
