// Session-77 probe v7 (Batch AD — Flashcards study deep measure): the
// study card FACES (front gradient? back white?), the Wrong button, the
// rating flow through to completion, the card list rows + deck sidebar
// button anatomy. Residue-zero cleanup.
// Usage: node scripts/ref-ad-flashcards3-s77.mjs
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

const cardFace = (sel) =>
  page.evaluate((selText) => {
    const p = [...document.querySelectorAll("p")].find((el) => el.offsetParent && (el.textContent || "").trim() === selText);
    if (!p) return null;
    // walk up until a bg/gradient/radius-bearing ancestor
    let el = p;
    for (let i = 0; i < 5; i++) {
      const s = getComputedStyle(el);
      if (s.backgroundColor !== "rgba(0, 0, 0, 0)" || s.backgroundImage !== "none" || s.borderRadius !== "0px") break;
      el = el.parentElement;
      if (!el) break;
    }
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      cls: (el.className || "").toString().slice(0, 80),
      bg: s.backgroundColor, bgImage: s.backgroundImage.slice(0, 120),
      radius: s.borderRadius, border: s.border, w: Math.round(r.width), h: Math.round(r.height),
      display: s.display, position: s.position, boxShadow: s.boxShadow.slice(0, 80),
    };
  }, sel);

try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);

  await page.locator("a").filter({ hasText: "Flashcards" }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2200);

  // create deck via UI
  await page.locator('main button:has-text("Create Deck")').first().click();
  await page.waitForTimeout(1200);
  const dlg = page.locator("[role=dialog]").first();
  await dlg.locator("input").first().fill("Probe deck s77");
  await dlg.locator('button:has-text("Create Deck")').first().click();
  await page.waitForTimeout(2200);

  // select deck + add two cards via the Add Flashcard dialog
  await page.locator('main button:has-text("Probe deck s77")').first().click();
  await page.waitForTimeout(1500);
  for (const [front, back] of [["Probe front one s77", "Probe back one s77"], ["Probe front two s77", "Probe back two s77"]]) {
    await page.locator('main button:has-text("Add Card")').first().click();
    await page.waitForTimeout(1200);
    const cd = page.locator("[role=dialog]").first();
    const tas = cd.locator("textarea");
    await tas.nth(0).fill(front);
    await tas.nth(1).fill(back);
    await cd.locator('button:has-text("Add Card")').first().click();
    await page.waitForTimeout(2000);
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SHOTS}/77-ref-flashcards-list-rows.png` });

  // ---- the card LIST rows in the deck view ----
  const listRows = await page.evaluate(() => {
    const rows = [...document.querySelectorAll("main div, main button")].filter((el) => {
      if (!el.offsetParent) return false;
      const t = (el.textContent || "");
      return /probe front (one|two) s77/i.test(t) && !/exit study/i.test(t);
    });
    // take the smallest containers that hold a full row text
    const smallest = rows.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 200 && r.width < 700;
    }).sort((a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width);
    return smallest.slice(0, 2).map((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        cls: (el.className || "").toString().slice(0, 90), bg: s.backgroundColor, radius: s.borderRadius,
        border: s.border, w: Math.round(r.width), h: Math.round(r.height), pad: s.padding,
        text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 90),
        kids: [...el.querySelectorAll("span, p, button")].filter((c) => c.offsetParent).slice(0, 8).map((c) => {
          const cs = getComputedStyle(c);
          return { tag: c.tagName, text: (c.textContent || "").trim().slice(0, 22), fontSize: cs.fontSize, weight: cs.fontWeight, color: cs.color, bg: cs.backgroundColor };
        }),
      };
    });
  });
  console.log("CARD-LIST-ROWS:", j(listRows));

  // ---- the sidebar deck button anatomy ----
  const deckBtn = await page.evaluate(() => {
    const b = [...document.querySelectorAll("main button")].find((el) => el.offsetParent && /probe deck s77/i.test(el.textContent || ""));
    if (!b) return null;
    const s = getComputedStyle(b);
    const r = b.getBoundingClientRect();
    return {
      cls: (b.className || "").toString().slice(0, 90), bg: s.backgroundColor, radius: s.borderRadius,
      border: s.border, pad: s.padding, w: Math.round(r.width), h: Math.round(r.height), gap: s.gap,
      kids: [...b.querySelectorAll("span, p, div")].filter((c) => c.offsetParent).slice(0, 6).map((c) => {
        const cs = getComputedStyle(c);
        return { tag: c.tagName, text: (c.textContent || "").trim().slice(0, 26), fontSize: cs.fontSize, weight: cs.fontWeight, color: cs.color, bg: cs.backgroundColor };
      }),
    };
  });
  console.log("DECK-SIDEBAR-BUTTON:", j(deckBtn));

  // ---- enter study + measure the FACES ----
  await page.locator('main button:has-text("Study")').first().click();
  await page.waitForTimeout(2000);
  const front1 = await cardFace("Probe front two s77");
  console.log("FRONT-FACE:", j(front1));
  await page.screenshot({ path: `${SHOTS}/77-ref-flashcards-study-front.png` });

  // flip: click the card face
  const faceCenter = await page.evaluate(() => {
    const p = [...document.querySelectorAll("p")].find((el) => el.offsetParent && (el.textContent || "").trim() === "Probe front two s77");
    if (!p) return null;
    const r = p.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (faceCenter) { await page.mouse.click(faceCenter.x, faceCenter.y); await page.waitForTimeout(1000); }
  const back1 = await cardFace("Probe back two s77");
  console.log("BACK-FACE:", j(back1));
  await page.screenshot({ path: `${SHOTS}/77-ref-flashcards-study-back.png` });

  // the Wrong + Correct buttons after flip
  const ratingBtns = await page.evaluate(() =>
    [...document.querySelectorAll("button")].filter((b) => b.offsetParent && /^(wrong|correct)$/i.test((b.textContent || "").trim())).map((b) => {
      const s = getComputedStyle(b);
      const r = b.getBoundingClientRect();
      return { text: (b.textContent || "").trim(), bg: s.backgroundColor, bgImage: s.backgroundImage.slice(0, 100), color: s.color, radius: s.borderRadius, fontSize: s.fontSize, w: Math.round(r.width), h: Math.round(r.height) };
    })
  );
  console.log("RATING-BUTTONS:", j(ratingBtns));

  // rate CORRECT on card 1, then card 2 → completion state
  await page.locator('main button:has-text("Correct"), button:has-text("Correct")').first().click();
  await page.waitForTimeout(1200);
  const afterCorrect1 = await page.evaluate(() => ({
    text: (document.querySelector("main")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 250),
  }));
  console.log("AFTER-CORRECT-1:", j(afterCorrect1));
  // card 2: flip + correct
  const face2 = await page.evaluate(() => {
    const p = [...document.querySelectorAll("p")].find((el) => el.offsetParent && /probe front one s77/i.test(el.textContent || ""));
    if (!p) return null;
    const r = p.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (face2) { await page.mouse.click(face2.x, face2.y); await page.waitForTimeout(900); }
  await page.locator('button:has-text("Correct")').first().click().catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/77-ref-flashcards-study-complete.png` });
  const completion = await page.evaluate(() => ({
    text: (document.querySelector("main")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 300),
    headings: [...document.querySelectorAll("main h1, main h2, main h3, main h4")].filter((h) => h.offsetParent).map((h) => ({ tag: h.tagName, text: (h.textContent || "").trim().slice(0, 40), fontSize: getComputedStyle(h).fontSize, weight: getComputedStyle(h).fontWeight, color: getComputedStyle(h).color })),
    buttons: [...document.querySelectorAll("main button")].filter((b) => b.offsetParent).slice(0, 10).map((b) => ({ text: (b.textContent || "").trim().slice(0, 22) || "(icon)", bg: getComputedStyle(b).backgroundColor })),
  }));
  console.log("COMPLETION:", j(completion));

  // ---- cleanup ----
  const dels = [];
  const deckList = await api("GET", "/entities/FlashcardDeck");
  const decks = Array.isArray(deckList?.body) ? deckList.body : [];
  for (const d of decks) {
    if (/probe.*s77/i.test(j(d))) {
      const cardList = await api("GET", "/entities/Flashcard");
      const cards = Array.isArray(cardList?.body) ? cardList.body : [];
      for (const c of cards) {
        if (c.deck_id === d.id && /probe.*s77/i.test(j(c))) {
          const r = await api("DELETE", `/entities/Flashcard/${c.id}`);
          dels.push(`card=${r.status}`);
        }
      }
      const r = await api("DELETE", `/entities/FlashcardDeck/${d.id}`);
      dels.push(`deck=${r.status}`);
    }
  }
  console.log("DELETIONS:", j(dels));
  let residue = 0;
  for (const e of ["FlashcardDeck", "Flashcard"]) {
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
