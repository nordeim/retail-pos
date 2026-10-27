// palette-drift-v16.ts — authoritative palette drift check.
// Renders each Tailwind v4 oklch() palette value (from theme.css) and the
// corresponding v3 hex on a canvas inside Chromium, reads the sRGB pixel
// bytes, and reports the drift for every palette color the app uses on
// reference-measured surfaces.
import { chromium } from "playwright";

const V4_TO_V3: Array<[string, string]> = [
  // [v4 oklch, v3 hex] — from tailwindcss theme.css vs the v3 palette
  ["oklch(96.2% 0.059 95.617)", "#fef3c7"], // amber-100
  ["oklch(92.4% 0.12 95.746)", "#fde68a"], // amber-200
  ["oklch(76.9% 0.188 70.08)", "#f59e0b"], // amber-500
  ["oklch(66.6% 0.179 58.318)", "#d97706"], // amber-600
  ["oklch(96.2% 0.044 156.743)", "#dcfce7"], // green-100
  ["oklch(52.7% 0.154 150.069)", "#15803d"], // green-700
  ["oklch(62.3% 0.214 259.815)", "#6366f1"], // indigo-500
  ["oklch(51.1% 0.262 276.966)", "#4f46e5"], // indigo-600
  ["oklch(97% 0.014 254.604)", "#eef2ff"], // indigo-50
  ["oklch(63.7% 0.237 25.331)", "#ef4444"], // red-500
  ["oklch(97.1% 0.013 17.38)", "#fef2f2"], // red-50
  ["oklch(54.6% 0.245 262.881)", "#2563eb"], // blue-600
  ["oklch(97% 0.014 254.604)", "#eff6ff"], // blue-50
  ["oklch(69.6% 0.17 162.48)", "#10b981"], // emerald-500
  ["oklch(59.6% 0.145 163.225)", "#059669"], // emerald-600
  ["oklch(70.4% 0.04 256.788)", "#94a3b8"], // slate-400
  ["oklch(55.4% 0.046 257.417)", "#64748b"], // slate-500
  ["oklch(44.6% 0.043 257.281)", "#475569"], // slate-600
  ["oklch(37.2% 0.044 257.287)", "#334155"], // slate-700
  ["oklch(27.8% 0.033 256.848)", "#1e293b"], // slate-800
  ["oklch(54.1% 0.281 293.009)", "#7c3aed"], // violet-600
  ["oklch(79.9% 0.107 302.961)", "#c4b5fd"], // violet-300
];

const NAMES = ["amber-100","amber-200","amber-500","amber-600","green-100","green-700","indigo-500","indigo-600","indigo-50","red-500","red-50","blue-600","blue-50","emerald-500","emerald-600","slate-400","slate-500","slate-600","slate-700","slate-800","violet-600","violet-300"];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("about:blank");
const result = await page.evaluate(async (cases: Array<[string, string]>) => {
  const cv = document.createElement("canvas");
  cv.width = cases.length * 2;
  cv.height = 1;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  cases.forEach(([v4], i) => {
    ctx.fillStyle = v4;
    ctx.fillRect(i * 2, 0, 1, 1);
  });
  cases.forEach(([, v3], i) => {
    ctx.fillStyle = v3;
    ctx.fillRect(i * 2 + 1, 0, 1, 1);
  });
  const data = ctx.getImageData(0, 0, cases.length * 2, 1).data;
  return cases.map((_, i) => ({
    v4: [data[i * 8], data[i * 8 + 1], data[i * 8 + 2]],
    v3: [data[i * 8 + 4], data[i * 8 + 5], data[i * 8 + 6]],
  }));
}, V4_TO_V3);
await browser.close();

let driftCount = 0;
console.log("color         v4-pixels        v3-pixels        maxΔ  verdict");
result.forEach((r, i) => {
  const d = Math.max(
    Math.abs(r.v4[0] - r.v3[0]),
    Math.abs(r.v4[1] - r.v3[1]),
    Math.abs(r.v4[2] - r.v3[2]),
  );
  const verdict = d > 2 ? "DRIFT" : d <= 1 ? "ok" : "±2";
  if (d > 2) driftCount++;
  console.log(
    `${NAMES[i].padEnd(13)} ${JSON.stringify(r.v4).padEnd(16)} ${JSON.stringify(r.v3).padEnd(16)} ${String(d).padEnd(4)} ${verdict}`,
  );
});
console.log(`\n${driftCount}/${NAMES.length} colors drift beyond ±2`);
