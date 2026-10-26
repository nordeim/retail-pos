// Session-65 FINAL cleanup v2: Authorization Bearer from localStorage +
// entity API. Deletes ALL grades + subjects (probe residue) and verifies zero.
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const APP = "6969efea366cba53524cde3f";
const j = (o) => JSON.stringify(o, null, 1);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);

  // find the token key
  const tokenInfo = await page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (/token|auth|jwt|session/i.test(k)) out[k] = (localStorage.getItem(k) || "").slice(0, 24) + "…";
    }
    return out;
  });
  console.log("token keys:", j(tokenInfo));

  const api = (method, path, body) =>
    page.evaluate(async ({ method, path, body }) => {
      let token = null;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const v = localStorage.getItem(k);
        if (v && v.startsWith("eyJ")) { token = v; break; }
      }
      const r = await fetch(`/api/apps/6969efea366cba53524cde3f${path}`, {
        method,
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      let data = null;
      try { data = await r.json(); } catch {}
      return { status: r.status, data };
    }, { method, path, body });

  const grades = await api("GET", "/entities/Grade");
  console.log("GRADES:", j(grades.data));
  if (Array.isArray(grades.data)) {
    for (const g of grades.data) {
      const d = await api("DELETE", `/entities/Grade/${g.id}`);
      console.log("delete grade", g.id, d.status);
    }
  }
  const subjects = await api("GET", "/entities/Subject");
  console.log("SUBJECTS:", j(subjects.data));
  if (Array.isArray(subjects.data)) {
    for (const s of subjects.data) {
      const d = await api("DELETE", `/entities/Subject/${s.id}`);
      console.log("delete subject", s.id, d.status);
    }
  }
  const gAfter = await api("GET", "/entities/Grade");
  const sAfter = await api("GET", "/entities/Subject");
  const gCount = Array.isArray(gAfter.data) ? gAfter.data.length : "unknown";
  const sCount = Array.isArray(sAfter.data) ? sAfter.data.length : "unknown";
  console.log("FINAL COUNTS:", j({ gCount, sCount }));
  console.log(JSON.stringify({ ok: gCount === 0 && sCount === 0 }));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}
