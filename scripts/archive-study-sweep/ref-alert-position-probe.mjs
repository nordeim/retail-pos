// Quick positional probe: DOM order of the login form's alert vs fields.
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("https://omni-study1.base44.app/login");
await page.waitForSelector("input[type=email]");
await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
await page.fill("input[type=password]", "wrong-password-1");
await page.click("button[type=submit]");
await page.waitForTimeout(2500);
const order = await page.evaluate(() => {
  const form = document.querySelector("form") || document.body;
  const els = [
    ...form.querySelectorAll("label, [role=alert], button[type=submit], input"),
  ];
  return els.map((el) => ({
    what: el.tagName + (el.getAttribute("role") ? "[alert]" : ""),
    text: (el.textContent || el.value || "").trim().slice(0, 40),
    parent: el.parentElement?.className?.split(" ").slice(0, 3).join(" "),
  }));
});
console.log(JSON.stringify(order, null, 1));
// Also: gap above/below alert + its margin classes
const geom = await page.evaluate(() => {
  const a = document.querySelector('[role="alert"]');
  if (!a) return null;
  const prev = a.previousElementSibling;
  const next = a.nextElementSibling;
  const r = a.getBoundingClientRect();
  return {
    alertHeight: Math.round(r.height),
    gapAbove: prev ? Math.round(r.top - prev.getBoundingClientRect().bottom) : null,
    gapBelow: next ? Math.round(next.getBoundingClientRect().top - r.bottom) : null,
    prevIs: prev?.querySelector("label")?.textContent ?? prev?.textContent?.slice(0, 25),
    nextIs: next?.textContent?.slice(0, 25),
    formSpacing: a.parentElement?.className?.slice(0, 80),
  };
});
console.log(JSON.stringify(geom, null, 1));
await browser.close();
