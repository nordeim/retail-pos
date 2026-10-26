// VLM-verify the S22 dev-server captures (the remediated codebase renders
// the standing surfaces correctly — the boot guard adds zero runtime chrome).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "s22-dev-dashboard.png",
    expect: "A desktop study-app dashboard on a light background: a left sidebar with the StudyFlow brand and 20 navigation items (Dashboard active), a greeting header 'Good morning, Demo Student', a red/amber overdue alert banner ('You have 1 overdue item(s)'), four stat cards (0/3 tasks, 5, 2, 1h), a 'Today's Progress' section, and content sections with task rows. Readable, no overlap or clipping.",
  },
  {
    file: "s22-dev-export-page.png",
    expect: "A desktop data-export page on a light background: a header with a purple-gradient square icon with a download glyph, the heading 'Export Your Data', a 'Back to app' link and a 'Download JSON' button, a summary line about rows across 20 collections, a grid of twenty small count cards (Subjects, Tasks, etc.), and a 'The file you get' documentation card. No overlap or clipping.",
  },
  {
    file: "s22-dev-dashboard-mobile.png",
    expect: "A MOBILE (390px) study-app dashboard: a fixed top app bar with the StudyFlow brand and a live clock, a greeting header, a red/amber overdue banner, stat cards stacked in a narrow grid, and task content below — all fitting the narrow viewport with NO horizontal overflow.",
  },
];

for (const c of checks) {
  const b64 = readFileSync(`${OUT}/${c.file}`).toString("base64");
  try {
    const res = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Does this screenshot match the following description? Answer PASS or FAIL with one short reason.\n\n${c.expect}` },
            { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
          ],
        },
      ],
    });
    const answer = res.choices?.[0]?.message?.content ?? "(no answer)";
    console.log(`${c.file}: ${answer.slice(0, 220)}`);
  } catch (err) {
    console.log(`${c.file}: VLM ERROR ${String(err).slice(0, 160)}`);
  }
}
