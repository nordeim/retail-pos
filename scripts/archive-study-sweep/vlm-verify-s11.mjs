// VLM-verify the session-11 theme-system captures (hypothesis generator only
// — DOM probes stay authoritative per the S9 lesson).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  { file: "dark-Login.png", expect: "A DARK-themed login card on a dark background: dark slate card surface, a violet-to-indigo gradient circular logo with a graduation cap, 'Welcome to StudyFlow' in light text, dark input fields, a 'Continue with Google' button, a divider with an 'or' chip, and a violet 'Sign in' gradient button. The page must NOT be white/light." },
  { file: "dark-Dashboard.png", expect: "A DARK-themed dashboard: zinc-950 canvas, slate-900 cards with light text, a dark red-tinted overdue banner with light red text, violet accent icons and chart lines, dark sidebar with a violet-300 active Dashboard item. No white 'flashbulb' panels, no unreadable low-contrast text." },
  { file: "desktop-Dashboard.png", expect: "A LIGHT dashboard (regression guard): white cards on a very light canvas, a red-50/orange-50 gradient overdue banner, four stat cards, violet accents, sidebar with violet-600 active Dashboard text. Must look identical to the pre-session-11 light design." },
  { file: "01-login.png", expect: "A LIGHT login card (regression guard): white card, slate top strip, violet gradient circular logo, 'Welcome to StudyFlow' dark title, light input fields." },
];

for (const c of checks) {
  const b64 = readFileSync(`${OUT}/${c.file}`).toString("base64");
  try {
    const res = await zai.chat.completions.createVision({
      messages: [
        { role: "user", content: [
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
          { type: "text", text: `Does this screenshot match this description? Answer PASS or FAIL with one short sentence.\nDescription: ${c.expect}` },
        ] },
      ],
    });
    console.log(`${c.file}: ${res.choices[0]?.message?.content?.slice(0, 200) ?? "(no reply)"}`);
  } catch (e) {
    console.log(`${c.file}: VLM unavailable (${String(e).slice(0, 80)})`);
  }
}
