// Session-61 evidence capture — the remediated dashboard (the Lighthouse
// color/heading fixes are live) at the drift-check standard 1440x900.
// Same shape as the cwv-audit instrumentation: API login → storageState →
// screenshot. Run: node scripts/capture-s61.mjs
import { chromium } from "playwright";

const BASE = process.env.CAP_BASE ?? "http://localhost:3200";
const OUT = "docs/screenshots/61-clone-desktop-Dashboard.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const login = await page.request.post(`${BASE}/api/auth/login`, {
  data: { email: "demo@studyflow.app", password: "Demo1234!" },
});
if (!login.ok()) throw new Error(`login failed: ${login.status()}`);

await page.goto(`${BASE}/Dashboard`);
await page.waitForFunction(() =>
  /good (morning|afternoon|evening)/i.test(
    document.querySelector("main h1")?.textContent ?? "",
  ),
);
await page.waitForTimeout(2500); // data + clock settle
await page.screenshot({ path: OUT, fullPage: false });
console.log("saved", OUT);
await browser.close();
