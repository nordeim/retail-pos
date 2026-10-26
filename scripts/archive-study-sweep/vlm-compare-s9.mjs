// Session-9 VLM pairwise comparison: ref vs clone screenshots, per view.
// Usage: node scripts/vlm-compare-s9.mjs [View1,View2,...]
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "research/s9-probe";
const all = [
  "Dashboard", "MyDay", "Tasks", "Calendar", "Events", "Timetable",
  "Assignments", "Exams", "Notes", "Flashcards", "PracticeTests",
  "StudyGroups", "GradeTracker", "Analytics", "Files", "Calculator",
  "MathSolver", "AIAssistant", "FocusTimer", "Settings",
];
const views = process.argv[2] ? process.argv[2].split(",") : all;

const PROMPT = `You are comparing TWO screenshots of the SAME view of a study app.
Image 1 = the ORIGINAL reference app. Image 2 = the CLONE.
Ignore: different user names, different sample data text, different dates/counts, scrollbars, minor AA differences, and font rendering.
Focus on LAYOUT STRUCTURE, CHROME (headers, sidebars, buttons, tabs, cards, borders), ICON SHAPES, colors of containers, and arrangement of major blocks.
List every VISUAL difference you can find as a bullet: "element — ref does X, clone does Y".
If the two are structurally identical, reply exactly: IDENTICAL.
Keep it under 12 bullets, most important first.`;

for (const v of views) {
  let refB64, cloneB64;
  try {
    refB64 = readFileSync(`${OUT}/${v}-ref.png`).toString("base64");
    cloneB64 = readFileSync(`${OUT}/${v}-clone.png`).toString("base64");
  } catch {
    console.log(`${v}: screenshots missing, skipped`);
    continue;
  }
  try {
    const res = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/png;base64,${refB64}` } },
            { type: "image_url", image_url: { url: `data:image/png;base64,${cloneB64}` } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });
    console.log(`\n===== ${v} =====\n${res.choices[0]?.message?.content ?? "(no reply)"}`);
  } catch (e) {
    console.log(`${v}: VLM unavailable (${String(e).slice(0, 100)})`);
  }
}
