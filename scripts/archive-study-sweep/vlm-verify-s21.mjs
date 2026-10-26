// VLM-verify the S21 data-export page captures (count grid + download action).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "s21-export-page-light.png",
    expect: "A desktop data-export page on a light background: a header with a purple-gradient square icon containing a download glyph, the heading 'Export Your Data', a 'Back to app' link, and a 'Download JSON' button. Below: a summary line about rows across 20 collections, then a GRID OF TWENTY SMALL CARDS (Subjects, Task Lists, Tasks, Assignments, Exams, Events, Timetable Classes, Notebooks, Notes, Flashcard Decks, Flashcards, Practice Tests, Study Groups, Grades, Focus Sessions, Folders, Files, AI Messages, Calculator History, Holidays) each with a label and a large number. Below: a 'The file you get' documentation card with bullet points, and a small footer note. No overlap or clipping.",
  },
  {
    file: "s21-export-page-dark.png",
    expect: "The same Export Your Data page rendered in DARK MODE: near-black background, dark slate cards, light text — the header with the download icon, the 'Download JSON' action visible, the twenty count cards readable with light numbers on dark cards, and the documentation section readable. Readable contrast throughout.",
  },
  {
    file: "s21-export-page-mobile.png",
    expect: "The Export Your Data page on a MOBILE (narrow 390px) viewport: the header stacked with the 'Download JSON' action visible, the twenty count cards arranged in a narrow multi-row grid (2 per row) with NO horizontal page overflow, and the documentation card below. No overlap.",
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
