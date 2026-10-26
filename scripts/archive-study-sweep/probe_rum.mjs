import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    storageState: "tests/e2e/.auth/user.json",
  });
  const page = await ctx.newPage();
  const calls = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/rum")) calls.push({ kind: "req", method: req.method(), url: req.url() });
  });
  page.on("response", (res) => {
    if (res.url().includes("/api/rum")) calls.push({ kind: "res", status: res.status(), url: res.url() });
  });
  page.on("console", (msg) => {
    if (/rum|beacon/i.test(msg.text())) calls.push({ kind: "console", text: msg.text() });
  });
  await page.goto(BASE + "/Dashboard");
  await page.waitForTimeout(8000);
  console.log(JSON.stringify(calls, null, 2));
  const res = await page.request.get(BASE + "/api/rum");
  const body = await res.json();
  console.log("AGGREGATE:", JSON.stringify({ samples: body.samples, p75: body.p75, recent: body.recent?.slice(0, 4) }, null, 2));
  await browser.close();
}

main().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
