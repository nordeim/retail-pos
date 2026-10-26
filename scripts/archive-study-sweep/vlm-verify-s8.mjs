// VLM-verify the session-8 reworked screenshots (smoke check for layout
// integrity after the two-pane/single-column reworks).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  { file: "desktop-Notes.png", expect: "A two-pane layout: left column with 'Notes' title + a search box + two dropdown selects; right side a centered 'Select a note' empty state with a rounded gradient icon block. No separate page header above the two panes." },
  { file: "desktop-StudyGroups.png", expect: "A two-pane layout: left column titled 'Study Groups' with a search box and a small empty-state with gradient icon block; right side a centered 'Select a group' empty state." },
  { file: "desktop-MathSolver.png", expect: "A single centered column: 'Math Solver' header, then ONE white card containing a text area and Upload Image / Clear / Solve buttons, and a Solution card BELOW the input card (stacked vertically, not side-by-side)." },
  { file: "desktop-Analytics.png", expect: "Four stat cards in a row on top, then a 2x2 grid of chart cards (Task Activity, Focus Time, Assignment Status donut, Subject Workload), then an 'Active Items by Priority' card with chips." },
  { file: "desktop-Calendar.png", expect: "A month calendar card titled with a month/year, left/right chevron nav buttons, a day grid where one day is a solid violet filled cell, and a day-detail card on the right side." },
  { file: "desktop-Tasks.png", expect: "A two-pane tasks layout: left sidebar with 'All Tasks' and 'Important' filter buttons (with icons) and a 'My Lists' section; right side a task list with a search box with a magnifier icon in the header row next to an Add Task gradient button." },
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
    console.log(`${c.file}: ${res.choices[0]?.message?.content?.slice(0, 180) ?? "(no reply)"}`);
  } catch (e) {
    console.log(`${c.file}: VLM unavailable (${String(e).slice(0, 80)})`);
  }
}
