// Session-77 probe v4 (Batch AD — Notes accessories): the tag flow (Add
// tag... input → tag pill anatomy in editor + list row) and the Attach
// File button behavior (functional? dialog?). Residue-zero cleanup.
// Usage: node scripts/ref-ad-notes3-s77.mjs
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
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);

  await page.locator("a").filter({ hasText: "Notes" }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2200);
  await page.locator("main button", { hasText: /new note/i }).first().click();
  await page.waitForTimeout(1500);

  // ---- the Attach File button: functional? ----
  const attachBtn = page.locator('main button:has-text("Attach File")').first();
  const attachPresent = (await attachBtn.count()) > 0;
  console.log("ATTACH-PRESENT:", attachPresent);
  if (attachPresent) {
    const pre = await attachBtn.getAttribute("onclick").catch(() => null);
    await attachBtn.click();
    await page.waitForTimeout(1500);
    const dlgCount = await page.locator("[role=dialog], input[type=file]").count();
    console.log("ATTACH-CLICK: dialog-or-file-input count:", dlgCount);
    // dump any dialog that appeared
    if (dlgCount > 0) {
      const dlgDump = await page.evaluate(() => {
        const dlg = document.querySelector("[role=dialog]");
        if (!dlg) return { fileInput: !!document.querySelector("input[type=file]") };
        return {
          title: (dlg.querySelector("h1,h2,h3,[role=dialogtitle]")?.textContent || "").trim().slice(0, 60),
          text: (dlg.textContent || "").replace(/\s+/g, " ").trim().slice(0, 300),
          inputs: [...dlg.querySelectorAll("input")].map((i) => ({ type: i.type, placeholder: i.placeholder })),
        };
      });
      console.log("ATTACH-DIALOG:", j(dlgDump));
    }
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(800);
  }

  // ---- the tag flow: type a tag, Enter, measure the pill ----
  await page.locator('main input[placeholder*="Note title"]').first().fill("Probe note s77");
  const ql = page.locator("main .ql-editor").first();
  await ql.click();
  await page.keyboard.type("Tagged probe body.");
  const tagInp = page.locator('main input[placeholder*="Add tag"]').first();
  await tagInp.fill("probe-tag");
  await tagInp.press("Enter");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/77-ref-notes-tagged.png` });
  const tagState = await page.evaluate(() => {
    const out = {};
    // any tag pill near the tag input / in the editor pane?
    out.pills = [...document.querySelectorAll("main span, main button, main div")].filter((el) => {
      if (!el.offsetParent || el.children.length > 2) return false;
      const t = (el.textContent || "").trim();
      return /^probe-tag$/i.test(t) || /^×probe-tag$|^probe-tag×$/i.test(t);
    }).slice(0, 6).map((el) => {
      const s = getComputedStyle(el);
      return { tag: el.tagName, text: (el.textContent || "").trim(), bg: s.backgroundColor, color: s.color, radius: s.borderRadius, fontSize: s.fontSize, border: s.border, h: Math.round(el.getBoundingClientRect().height) };
    });
    return out;
  });
  console.log("TAG-PILLS-EDITOR:", j(tagState));

  // save + measure the list row with tag
  await page.locator('main button:has-text("Save")').first().click({ timeout: 15000 });
  await page.waitForTimeout(3000);
  const noteState = await api("GET", "/entities/Note");
  const noteRows = Array.isArray(noteState?.body) ? noteState.body : [];
  const mine = noteRows.find((r) => /probe note s77/i.test(r.title ?? ""));
  console.log("NOTE-SAVED-TAGS:", j({ count: noteRows.length, tags: mine?.tags, color: mine?.color }));
  const listTag = await page.evaluate(() => {
    const row = [...document.querySelectorAll("main button")].find((b) => b.offsetParent && /probe note s77/i.test(b.textContent || ""));
    if (!row) return "NOT-FOUND";
    return {
      text: (row.textContent || "").replace(/\s+/g, " ").trim().slice(0, 140),
      pills: [...row.querySelectorAll("span, button")].filter((el) => el.offsetParent && el.children.length === 0 && el.textContent?.trim()).slice(0, 8).map((el) => {
        const s = getComputedStyle(el);
        return { text: (el.textContent || "").trim().slice(0, 24), bg: s.backgroundColor, color: s.color, fontSize: s.fontSize, radius: s.borderRadius };
      }),
    };
  });
  console.log("LIST-ROW-WITH-TAG:", j(listTag));
  await page.screenshot({ path: `${SHOTS}/77-ref-notes-tagged-list.png` });

  // ---- cleanup ----
  const dels = [];
  const list = await api("GET", "/entities/Note");
  const rows = Array.isArray(list?.body) ? list.body : [];
  for (const row of rows) {
    if (/probe.*s77/i.test(j(row))) {
      const r = await api("DELETE", `/entities/Note/${row.id}`);
      dels.push(`${(row.title ?? "?").slice(0, 20)}=${r.status}`);
    }
  }
  console.log("DELETIONS:", j(dels));
  const fin = await api("GET", "/entities/Note");
  const remain = (Array.isArray(fin?.body) ? fin.body : []).filter((r) => /probe.*s77/i.test(j(r)));
  console.log("FINAL-RESIDUE:", remain.length);
} catch (e) {
  console.log("FATAL:", String(e).slice(0, 400));
} finally {
  await browser.close();
}
