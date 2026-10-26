import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/login");
  await page.getByRole("button", { name: /sign up/i }).click();
  const email = `probe-geo-${Date.now()}@example.com`;
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Probe1234!");
  await page.getByLabel("Confirm Password").fill("Probe1234!");
  await page.getByRole("button", { name: /create account/i }).click();
  await page.getByRole("heading", { name: "Verify your email" }).waitFor({ timeout: 15000 });

  const m = await page.evaluate(() => {
    const r = (el) => {
      const b = el.getBoundingClientRect();
      return { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), h: +b.height.toFixed(1) };
    };
    const back = [...document.querySelectorAll("button")].find((b) => /back to sign in/i.test(b.textContent ?? ""));
    const chip = document.querySelector("span.sf-print-exact");
    const h2 = [...document.querySelectorAll("h2")].find((h) => /verify/i.test(h.textContent ?? ""));
    return {
      back: back ? r(back) : null,
      chip: chip ? r(chip) : null,
      h2: h2 ? r(h2) : null,
      h2MarginTop: h2 ? getComputedStyle(h2).marginTop : null,
      h2LineHeight: h2 ? getComputedStyle(h2).lineHeight : null,
      chipMarginBottom: chip ? getComputedStyle(chip).marginBottom : null,
      containerMarginTop: chip?.parentElement ? getComputedStyle(chip.parentElement).marginTop : null,
      backLineHeight: back ? getComputedStyle(back).lineHeight : null,
      gap: back && h2 ? +(h2.getBoundingClientRect().y - back.getBoundingClientRect().bottom).toFixed(1) : null,
    };
  });
  console.log(JSON.stringify(m, null, 2));
  await browser.close();
}

main().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
