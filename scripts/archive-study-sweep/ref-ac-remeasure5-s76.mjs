// Session-76 probe v5: the assignment due-label mapping — API-created rows
// with controlled dueDates (overdue -5d, today, +1d, +7d) so the pill label
// + tint mapping is measured for EVERY bucket (the UI picker cannot create
// past dates). Cleans to residue zero.
// Usage: node scripts/ref-ac-remeasure5-s76.mjs
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
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

try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);

  // what does an existing assignment row actually carry? (field names)
  const existing = await api("GET", "/entities/Assignment");
  console.log("EXISTING-ASSIGN-COUNT:", Array.isArray(existing?.body) ? existing.body.length : existing?.status);
  if (Array.isArray(existing?.body) && existing.body.length > 0) {
    console.log("SAMPLE-FIELDS:", j(Object.keys(existing.body[0]).slice(0, 20)));
    console.log("SAMPLE-ROW:", j(existing.body[0]));
  }

  // API-create the label-mapping rows (the picker can't make past dates)
  const now = new Date();
  const iso = (dayOffset, hour = 12) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour);
    return d.toISOString();
  };
  const mk = [
    { title: "Probe A overdue5 s76", dueDate: iso(-5) },
    { title: "Probe A today s76", dueDate: iso(0) },
    { title: "Probe A plus1 s76", dueDate: iso(1) },
    { title: "Probe A plus7 s76", dueDate: iso(7) },
  ];
  const created = [];
  for (const m of mk) {
    const r = await api("POST", "/entities/Assignment", m);
    created.push({ title: m.title, status: r.status, id: r.body?.data?.id ?? r.body?.id ?? null, due: m.dueDate });
  }
  console.log("CREATED:", j(created));

  // measure (All filter so overdue rows render)
  await visit("Assignments");
  await page.waitForTimeout(1500);
  // switch the status filter to All (default Active hides completed only; overdue stays)
  const allOpt = page.locator("main button, main [role=combobox]").filter({ hasText: /active/i }).first();
  if ((await allOpt.count()) > 0) {
    await allOpt.click().catch(() => {});
    await page.waitForTimeout(700);
    const all = page.locator("[role=option]", { hasText: /^All$/ }).first();
    if ((await all.count()) > 0) { await all.click(); await page.waitForTimeout(900); }
  }
  const pills = await page.evaluate(() => {
    const out = [];
    for (const card of [...document.querySelectorAll("main article, main div[class*=rounded-xl]")].slice(0, 14)) {
      const t = (card.textContent || "").trim();
      if (!/probe a .*s76/i.test(t)) continue;
      const title = card.querySelector("h1,h2,h3,p[class*=font-semibold],p[class*=font-medium]");
      const first = [...card.querySelectorAll("span")].find((el) => {
        const txt = (el.textContent || "").trim();
        return /^(tomorrow|today|\d+ days?|overdue|overdue by.*|no due)/i.test(txt);
      });
      if (!first) { out.push({ row: t.slice(0, 70), pill: "NONE-FOUND" }); continue; }
      const s = getComputedStyle(first);
      out.push({
        row: (title?.textContent || "").trim().slice(0, 40),
        pill: (first.textContent || "").trim(),
        bg: s.backgroundColor,
        color: s.color,
      });
    }
    return out;
  });
  console.log("MEASURE-LABELS:", j(pills));

  // cleanup by id (fallback: match by title)
  const list = await api("GET", "/entities/Assignment");
  const rows = Array.isArray(list?.body) ? list.body : [];
  const dels = [];
  for (const row of rows) {
    if (/probe a .*s76/i.test(row.title ?? "")) {
      const r = await api("DELETE", `/entities/Assignment/${row.id ?? row.data?.id}`);
      dels.push(`${(row.title ?? "").slice(0, 24)}=${r.status}`);
    }
  }
  console.log("DELETIONS:", j(dels));
  const fin = await api("GET", "/entities/Assignment");
  const remain = (Array.isArray(fin?.body) ? fin.body : []).filter((r) => /probe.*s76/i.test(r.title ?? ""));
  console.log("FINAL-RESIDUE:", remain.length);
} catch (e) {
  console.log("FATAL:", String(e).slice(0, 400));
} finally {
  await browser.close();
}
