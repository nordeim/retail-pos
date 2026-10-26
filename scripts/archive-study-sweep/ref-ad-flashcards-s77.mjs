// Session-77 probe v5 (Batch AD — Flashcards): drives the ref's own UI to
// create a probe deck + cards, enters study mode, measures the study screen
// anatomy (overlay, counter, card faces, nav buttons, difficulty rating),
// then residue-zero cleanup (deck + cards).
// Usage: node scripts/ref-ad-flashcards-s77.mjs
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

  // ---- create the probe deck through the ref's dialog ----
  await page.locator('main button:has-text("Create Deck")').first().click();
  await page.waitForTimeout(1500);
  const deckDlg = await page.evaluate(() => {
    const dlg = document.querySelector("[role=dialog]");
    if (!dlg) return { error: "no dialog" };
    return {
      title: (dlg.querySelector("h1,h2,h3")?.textContent || "").trim(),
      inputs: [...dlg.querySelectorAll("input, textarea, select")].map((i) => ({ tag: i.tagName, type: i.type, placeholder: i.placeholder, aria: i.getAttribute("aria-label") })),
      buttons: [...dlg.querySelectorAll("button")].map((b) => (b.textContent || "").trim().slice(0, 24) || "(icon)"),
      text: (dlg.textContent || "").replace(/\s+/g, " ").trim().slice(0, 300),
    };
  });
  console.log("DECK-DIALOG:", j(deckDlg));

  // fill whatever inputs the dialog carries
  const dlg = page.locator("[role=dialog]").first();
  const nameInp = dlg.locator("input").first();
  if ((await nameInp.count()) > 0) await nameInp.fill("Probe deck s77");
  await dlg.locator('button:has-text("Create"), button:has-text("Save"), button:has-text("Add")').first().click().catch(() => {});
  await page.waitForTimeout(2500);
  const deckState = await api("GET", "/entities/FlashcardDeck");
  const deckRows = Array.isArray(deckState?.body) ? deckState.body : [];
  console.log("AFTER-DECK-CREATE:", j({ count: deckRows.length, row: deckRows[0] ? j(deckRows[0]).slice(0, 400) : null }));
  await page.screenshot({ path: `${SHOTS}/77-ref-flashcards-deck-created.png` });

  // ---- find the Add Card flow ----
  const populatedDump = await page.evaluate(() => {
    const out = { headings: [], buttons: [], text: (document.querySelector("main")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 400) };
    for (const h of document.querySelectorAll("main h1, main h2, main h3")) out.headings.push({ tag: h.tagName, text: (h.textContent || "").trim().slice(0, 40) });
    for (const b of [...document.querySelectorAll("main button")].slice(0, 24)) out.buttons.push((b.textContent || "").trim().slice(0, 28) || b.getAttribute("aria-label") || "(icon)");
    return out;
  });
  console.log("AFTER-DECK-DUMP:", j(populatedDump));

  const addCard = page.locator('main button:has-text("Add Card"), main button:has-text("Add Flashcard"), main button:has-text("New Card"), main button:has-text("Add")').first();
  if ((await addCard.count()) > 0) {
    await addCard.click();
    await page.waitForTimeout(1500);
    const cardDlg = await page.evaluate(() => {
      const d = document.querySelector("[role=dialog]");
      if (!d) return { error: "no dialog" };
      return {
        title: (d.querySelector("h1,h2,h3")?.textContent || "").trim(),
        inputs: [...d.querySelectorAll("input, textarea")].map((i) => ({ tag: i.tagName, placeholder: i.placeholder, aria: i.getAttribute("aria-label") })),
        buttons: [...d.querySelectorAll("button")].map((b) => (b.textContent || "").trim().slice(0, 24) || "(icon)"),
      };
    });
    console.log("CARD-DIALOG:", j(cardDlg));
    // fill front/back if inputs exist
    const cd = page.locator("[role=dialog]").first();
    const inputs = cd.locator("input, textarea");
    const n = await inputs.count();
    if (n >= 2) {
      await inputs.nth(0).fill("Probe front one s77");
      await inputs.nth(1).fill("Probe back one s77");
      await cd.locator('button:has-text("Add"), button:has-text("Save"), button:has-text("Create")').first().click().catch(() => {});
      await page.waitForTimeout(2000);
    }
    console.log("CARD1-ADDED: inputs-found:", n);
  } else {
    console.log("ADD-CARD-BUTTON: NOT FOUND — trying API creation");
    const deckId = deckRows[0]?.id;
    if (deckId) {
      const r1 = await api("POST", "/entities/Flashcard", { front: "Probe front one s77", back: "Probe back one s77", deck_id: deckId, difficulty: "medium" });
      const r2 = await api("POST", "/entities/Flashcard", { front: "Probe front two s77", back: "Probe back two s77", deck_id: deckId, difficulty: "easy" });
      console.log("API-CARDS:", j([r1.status, r2.status]));
    }
  }
  const cardState = await api("GET", "/entities/Flashcard");
  const cardRows = Array.isArray(cardState?.body) ? cardState.body : [];
  console.log("CARDS:", j({ count: cardRows.length, mine: cardRows.filter((c) => /probe.*s77/i.test(j(c))).length }));
  await page.screenshot({ path: `${SHOTS}/77-ref-flashcards-with-cards.png` });

  // ---- enter study mode + measure ----
  const studyBtn = page.locator('main button:has-text("Study"), main button:has-text("Start Study"), main button:has-text("Start")').first();
  const studyPresent = (await studyBtn.count()) > 0;
  console.log("STUDY-BTN:", studyPresent, studyPresent ? (await studyBtn.textContent() || "").trim() : "");
  if (studyPresent) {
    await studyBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SHOTS}/77-ref-flashcards-study.png` });
    const studyDump = await page.evaluate(() => {
      // the study surface: overlay or a replaced pane?
      const overlay = [...document.querySelectorAll("body > div")].find((d) => {
        const s = getComputedStyle(d);
        return s.position === "fixed" && (s.zIndex !== "auto" || d.className.toString().includes("fixed"));
      });
      const root = overlay || document.querySelector("main");
      const out = {
        overlayFound: !!overlay,
        overlayBg: overlay ? getComputedStyle(overlay).backgroundColor : null,
        nodes: [],
      };
      for (const el of root.querySelectorAll("h1, h2, h3, h4, p, button, span, div")) {
        if (!el.offsetParent && el.tagName !== "BODY") continue;
        if (el.children.length > 3) continue;
        const txt = (el.textContent || "").trim();
        if (!txt || txt.length > 60) continue;
        const s = getComputedStyle(el);
        out.nodes.push({
          tag: el.tagName, text: txt.slice(0, 40), cls: (el.className || "").toString().slice(0, 50),
          fontSize: s.fontSize, weight: s.fontWeight, color: s.color, bg: s.backgroundColor,
          radius: s.borderRadius, w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height),
        });
        if (out.nodes.length > 26) break;
      }
      return out;
    });
    console.log("STUDY-DUMP:", j(studyDump));

    // the card itself: find the big flip surface + click to flip
    const cardEl = await page.evaluate(() => {
      const cands = [...document.querySelectorAll("div")].filter((d) => {
        const r = d.getBoundingClientRect();
        return r.width > 250 && r.height > 150 && r.height < 500 && d.offsetParent;
      });
      return cands.map((d) => {
        const s = getComputedStyle(d);
        const r = d.getBoundingClientRect();
        return { cls: (d.className || "").toString().slice(0, 60), bg: s.backgroundColor, radius: s.borderRadius, w: Math.round(r.width), h: Math.round(r.height), cursor: s.cursor, text: (d.textContent || "").trim().slice(0, 40) };
      }).slice(0, 8);
    });
    console.log("CARD-CANDIDATES:", j(cardEl));

    // click the center of the biggest card-like div to flip
    const bigCard = await page.evaluate(() => {
      const cands = [...document.querySelectorAll("div")].filter((d) => {
        const r = d.getBoundingClientRect();
        return r.width > 250 && r.height > 180 && r.height < 500 && d.offsetParent;
      });
      if (cands.length === 0) return null;
      const best = cands.sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height)[0];
      const r = best.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (bigCard) {
      await page.mouse.click(bigCard.x, bigCard.y);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SHOTS}/77-ref-flashcards-study-flipped.png` });
      const flipped = await page.evaluate(() => {
        const out = { text: (document.body.textContent || "").replace(/\s+/g, " ").trim().slice(0, 300) };
        return out;
      });
      console.log("AFTER-FLIP-TEXT:", j(flipped));
    }
    // nav buttons present?
    const navBtns = await page.evaluate(() => [...document.querySelectorAll("button")].filter((b) => b.offsetParent && /prev|next|skip|again|good|easy|hard|got it|correct|incorrect|flip/i.test((b.textContent || b.getAttribute("aria-label") || ""))).slice(0, 10).map((b) => ({ text: (b.textContent || b.getAttribute("aria-label") || "").trim().slice(0, 20), bg: getComputedStyle(b).backgroundColor, color: getComputedStyle(b).color })));
    console.log("STUDY-NAV-BUTTONS:", j(navBtns));
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(800);
  }

  // ---- cleanup: probe deck + its cards (NEVER the pre-existing orphan) ----
  const dels = [];
  const deckList = await api("GET", "/entities/FlashcardDeck");
  const decks = Array.isArray(deckList?.body) ? deckList.body : [];
  for (const d of decks) {
    if (/probe.*s77/i.test(j(d))) {
      // delete its cards first
      const cardList = await api("GET", "/entities/Flashcard");
      const cards = Array.isArray(cardList?.body) ? cardList.body : [];
      for (const c of cards) {
        if (c.deck_id === d.id && /probe.*s77/i.test(j(c))) {
          const r = await api("DELETE", `/entities/Flashcard/${c.id}`);
          dels.push(`card:${(c.front ?? "?").slice(0, 20)}=${r.status}`);
        }
      }
      const r = await api("DELETE", `/entities/FlashcardDeck/${d.id}`);
      dels.push(`deck:${(d.name ?? "?").slice(0, 20)}=${r.status}`);
    }
  }
  console.log("DELETIONS:", j(dels));
  // final residue
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
