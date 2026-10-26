import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: "tests/e2e/.auth/user.json" });
  const page = await ctx.newPage();
  const log = [];
  page.on("requestfailed", (req) => log.push({ kind: "reqfailed", url: req.url(), err: req.failure()?.errorText }));
  page.on("response", (res) => { if (res.status() >= 400) log.push({ kind: "http" + res.status(), url: res.url() }); });
  page.on("pageerror", (err) => log.push({ kind: "pageerror", msg: String(err).slice(0, 200) }));
  page.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "warning") log.push({ kind: msg.type(), text: msg.text().slice(0, 200) }); });

  await page.goto(BASE + "/Dashboard");
  await page.waitForTimeout(6000);

  const cookie = await page.evaluate(() => document.cookie);
  const importTest = await page.evaluate(async () => {
    try {
      const v = await import("web-vitals");
      return { ok: true, hasOnTTFB: typeof v.onTTFB };
    } catch (e) {
      return { ok: false, err: String(e).slice(0, 200) };
    }
  });
  const rumCalls = await page.evaluate(() => performance.getEntriesByType("resource").filter((e) => e.name.includes("/api/rum")).map((e) => e.name));
  console.log("COOKIE has sf_session:", cookie.includes("sf_session"));
  console.log("IMPORT web-vitals:", JSON.stringify(importTest));
  console.log("RUM resource entries:", JSON.stringify(rumCalls));
  console.log("LOG:", JSON.stringify(log, null, 2));
  await browser.close();
}

main().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
