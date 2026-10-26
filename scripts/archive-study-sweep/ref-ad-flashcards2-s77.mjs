// Session-77 probe v6 (Batch AD — Flashcards part 2): SELECT the probe
// deck first (the ref's right pane needs it), then find the Add Card flow,
// create cards through the UI, enter study mode, measure the study screen.
// Residue-zero cleanup.
// Usage: node scripts/ref-ad-flashcards2-s77.mjs
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

  await page.locator("a").filter({ hasText: "Flashcards" }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2200);

  // create the probe deck
  await page.locator('main button:has-text("Create Deck")').first().click();
  await page.waitForTimeout(1200);
  const dlg = page.locator("[role=dialog]").first();
  await dlg.locator("input").first().fill("Probe deck s77");
  await dlg.locator('button:has-text("Create Deck")').first().click();
  await page.waitForTimeout(2200);

  // SELECT the deck (click its sidebar button)
  await page.locator('main button:has-text("Probe deck s77")').first().click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${SHOTS}/77-ref-flashcards-deck-selected.png` });
  const selectedDump = await page.evaluate(() => {
    const out = { headings: [], buttons: [], text: (document.querySelector("main")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 500) };
    for (const h of document.querySelectorAll("main h1, main h2, main h3, main h4")) {
      const s = getComputedStyle(h);
      out.headings.push({ tag: h.tagName, text: (h.textContent || "").trim().slice(0, 44), fontSize: s.fontSize, weight: s.fontWeight, color: s.color });
    }
    for (const b of [...document.querySelectorAll("main button")].slice(0, 28)) {
      out.buttons.push({ text: (b.textContent || "").trim().slice(0, 26) || b.getAttribute("aria-label") || "(icon)", bg: getComputedStyle(b).backgroundColor, color: getComputedStyle(b).color });
    }
    return out;
  });
  console.log("DECK-SELECTED-DUMP:", j(selectedDump));

  // ---- the Add Card flow ----
  const addCard = page.locator('main button:has-text("Add Card"), main button:has-text("Add Flashcard"), main button:has-text("New Card"), main button:has-text("Add Card"), main button:has-text("Add")').first();
  const addPresent = (await addCard.count()) > 0;
  console.log("ADD-CARD-PRESENT:", addPresent);
  if (addPresent) {
    await addCard.click();
    await page.waitForTimeout(1500);
    const cardDlg = await page.evaluate(() => {
      const d = document.querySelector("[role=dialog]");
      if (!d) return { error: "no dialog" };
      return {
        title: (d.querySelector("h1,h2,h3")?.textContent || "").trim(),
        inputs: [...d.querySelectorAll("input, textarea")].map((i) => ({ tag: i.tagName, placeholder: i.placeholder, aria: i.getAttribute("aria-label") })),
        selects: [...d.querySelectorAll("select, [role=combobox]")].map((s) => ({ text: (s.textContent || "").trim().slice(0, 40) })),
        buttons: [...d.querySelectorAll("button")].map((b) => (b.textContent || "").trim().slice(0, 24) || "(icon)"),
      };
    });
    console.log("CARD-DIALOG:", j(cardDlg));
    await page.screenshot({ path: `${SHOTS}/77-ref-flashcards-card-dialog.png` });

    // fill front/back + difficulty
    const cd = page.locator("[role=dialog]").first();
    const fields = cd.locator("input, textarea");
    const n = await fields.count();
    console.log("CARD-DIALOG-FIELD-COUNT:", n);
    if (n >= 2) {
      await fields.nth(0).fill("Probe front one s77");
      await fields.nth(1).fill("Probe back one s77");
      await cd.locator('button:has-text("Add"), button:has-text("Save"), button:has-text("Create")').first().click().catch(() => {});
      await page.waitForTimeout(2200);
    }
  }

  // ensure ≥2 cards exist (API fallback for the second card)
  const deckList0 = await api("GET", "/entities/FlashcardDeck");
  const deck0 = (Array.isArray(deckList0?.body) ? deckList0.body : []).find((d) => /probe.*s77/i.test(d.name ?? ""));
  const cardList0 = await api("GET", "/entities/Flashcard");
  const myCards0 = (Array.isArray(cardList0?.body) ? cardList0.body : []).filter((c) => c.deck_id === deck0?.id && /probe.*s77/i.test(j(c)));
  if (deck0 && myCards0.length < 2) {
    await api("POST", "/entities/Flashcard", { front: "Probe front two s77", back: "Probe back two s77", deck_id: deck0.id, difficulty: "easy" });
  }
  await page.waitForTimeout(600);
  await page.reload();
  await page.waitForTimeout(2500);
  // re-select the deck
  await page.locator('main button:has-text("Probe deck s77")').first().click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${SHOTS}/77-ref-flashcards-populated.png` });
  const populatedDump = await page.evaluate(() => {
    const out = { headings: [], buttons: [], cards: [] };
    for (const h of document.querySelectorAll("main h1, main h2, main h3, main h4")) {
      const s = getComputedStyle(h);
      out.headings.push({ tag: h.tagName, text: (h.textContent || "").trim().slice(0, 44), fontSize: s.fontSize, weight: s.fontWeight, color: s.color });
    }
    for (const b of [...document.querySelectorAll("main button")].slice(0, 28)) {
      out.buttons.push({ text: (b.textContent || "").trim().slice(0, 26) || b.getAttribute("aria-label") || "(icon)", bg: getComputedStyle(b).backgroundColor, color: getComputedStyle(b).color });
    }
    return out;
  });
  console.log("POPULATED-DUMP:", j(populatedDump));

  // ---- enter study mode ----
  const studyBtn = page.locator('main button:has-text("Study"), main button:has-text("Start"), main button:has-text("Review")').first();
  const studyPresent = (await studyBtn.count()) > 0;
  console.log("STUDY-BTN:", studyPresent, studyPresent ? (await studyBtn.textContent() || "").trim() : "");
  if (studyPresent) {
    await studyBtn.click();
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `${SHOTS}/77-ref-flashcards-study.png` });
    const studyDump = await page.evaluate(() => {
      const overlay = [...document.querySelectorAll("body > div, body > section")].find((d) => {
        const s = getComputedStyle(d);
        return s.position === "fixed";
      });
      const root = overlay || document.querySelector("main");
      const out = {
        overlayFound: !!overlay,
        overlayBg: overlay ? getComputedStyle(overlay).backgroundColor : null,
        overlayCls: overlay ? (overlay.className || "").toString().slice(0, 60) : null,
        nodes: [],
      };
      for (const el of root.querySelectorAll("h1, h2, h3, h4, p, button, span")) {
        if (!el.offsetParent) continue;
        if (el.children.length > 2) continue;
        const txt = (el.textContent || "").trim();
        if (!txt || txt.length > 70) continue;
        const s = getComputedStyle(el);
        out.nodes.push({
          tag: el.tagName, text: txt.slice(0, 44), fontSize: s.fontSize, weight: s.fontWeight,
          color: s.color, bg: s.backgroundColor, radius: s.borderRadius,
          w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height),
        });
        if (out.nodes.length > 28) break;
      }
      return out;
    });
    console.log("STUDY-DUMP:", j(studyDump));

    // the big card surface + flip
    const bigCard = await page.evaluate(() => {
      const cands = [...document.querySelectorAll("div")].filter((d) => {
        const r = d.getBoundingClientRect();
        return r.width > 280 && r.height > 180 && r.height < 520 && d.offsetParent;
      });
      if (!cands.length) return null;
      const best = cands.sort((a, b) => {
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return rb.width * rb.height - ra.width * ra.height;
      })[0];
      const s = getComputedStyle(best);
      const r = best.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, cls: (best.className || "").toString().slice(0, 60), bg: s.backgroundColor, color: s.color, radius: s.borderRadius, w: Math.round(r.width), h: Math.round(r.height), cursor: s.cursor, text: (best.textContent || "").trim().slice(0, 50) };
    });
    console.log("BIG-CARD:", j(bigCard));
    if (bigCard) {
      await page.mouse.click(bigCard.x, bigCard.y);
      await page.waitForTimeout(1100);
      await page.screenshot({ path: `${SHOTS}/77-ref-flashcards-study-flipped.png` });
      const afterFlip = await page.evaluate(() => {
        const big = [...document.querySelectorAll("div")].filter((d) => {
          const r = d.getBoundingClientRect();
          return r.width > 280 && r.height > 180 && r.height < 520 && d.offsetParent;
        }).sort((a, b) => {
          const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
          return rb.width * rb.height - ra.width * ra.height;
        })[0];
        if (!big) return { changed: false };
        const s = getComputedStyle(big);
        return { changed: true, text: (big.textContent || "").trim().slice(0, 80), bg: s.backgroundColor, color: s.color, transform: s.transform };
      });
      console.log("AFTER-FLIP:", j(afterFlip));
    }
    const navBtns = await page.evaluate(() => [...document.querySelectorAll("button")].filter((b) => b.offsetParent && /prev|next|skip|again|good|easy|hard|got|correct|incorrect|flip|edit|delete|shuffle|restart/i.test((b.textContent || b.getAttribute("aria-label") || ""))).slice(0, 12).map((b) => ({ text: (b.textContent || b.getAttribute("aria-label") || "").trim().slice(0, 24), bg: getComputedStyle(b).backgroundColor, color: getComputedStyle(b).color, h: Math.round(b.getBoundingClientRect().height) })));
    console.log("STUDY-NAV-BUTTONS:", j(navBtns));
    await page.keyboard.press("Escape").catch(() => {});
  }

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
          dels.push(`card:${(c.front ?? "?").slice(0, 18)}=${r.status}`);
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
