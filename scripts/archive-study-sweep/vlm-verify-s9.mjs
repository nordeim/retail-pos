// VLM-verify the session-9 reworked screenshots (smoke check for layout
// integrity after the banner/empty-state/chart/filter reworks).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  { file: "desktop-Dashboard.png", expect: "A dashboard with a greeting, then a RED-ISH alert banner ('You have 1 overdue item(s)') with an icon block and View All link, then four stat cards (Today's Progress, Pending Tasks, Due Soon, Focus Time), then task/exam/assignment card lists." },
  { file: "desktop-Calendar.png", expect: "A month calendar card titled 'October 2026' with left/right chevron buttons, a weekday header row starting with Sun and ending with Sat, a day grid where the first column aligns with Sunday, one solid violet selected day, and a day-detail card on the right. Top-right: a white bordered Calendar/Timeline toggle with icons." },
  { file: "desktop-Analytics.png", expect: "Four stat cards on top (Tasks Completed, Assignments, Focus Time, Upcoming Exams), then a 2x2 grid of chart cards: Task Activity and Focus Time are AREA charts with axis labels and dashed gridlines, Assignment Status is a donut, Subject Workload has subject bars." },
  { file: "desktop-MyDay.png", expect: "A My Day page with an amber gradient sun block + 'My Day' title, an amber 'Today's Progress' card with a progress bar, a quick-add input with a plus icon and a 'More Options' button (NO other submit button), task card rows, and a Suggestions toggle." },
  { file: "desktop-Tasks.png", expect: "A two-pane tasks layout: left sidebar with All Tasks/Important filters (list and star icons) and a My Lists section (empty body); right side a task list with a search box, an 'Active' outline button with a funnel/filter icon, and a gradient Add Task button." },
  { file: "desktop-Settings.png", expect: "A Settings page with a white bordered row of five tabs (Appearance, Profile, Subjects, Holidays, Notifications) EACH carrying a small leading icon (palette, user, book, calendar, bell)." },
  { file: "desktop-Flashcards.png", expect: "A two-panel flashcards layout: left column with 'Flashcards' title, search, and deck rows with colored icon blocks; the deck detail on the right showing cards with difficulty pills and gradient Study button." },
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
