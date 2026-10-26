// VLM-verify the S23 dev-server captures (the remediated codebase renders
// the /export portability page with the Restore card in every mode).
// Per the S9 lesson: VLM findings are hypotheses — DOM probes are the
// authority (the capture script's chrome reads are the DOM-side truth).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "s23-export-import-card-light.png",
    expect: "A desktop data-export page on a light background: a header with a purple-gradient square icon with a download glyph, the heading 'Export Your Data', 'Back to app' and 'Download JSON' actions, a grid of twenty count cards, 'The file you get' documentation card, AND below it a 'Restore from a backup' card with a 'Choose a StudyFlow export' file row and an 'Import' button. Readable, no overlap or clipping.",
  },
  {
    file: "s23-export-import-card-dark.png",
    expect: "The SAME data-export page rendered in DARK MODE (dark background, light text): the count grid, the format card, and the 'Restore from a backup' import card with the file row and Import button — all readable on the dark background, no overlap or clipping.",
  },
  {
    file: "s23-import-result-state.png",
    expect: "The data-export page with a COMPLETED import result: inside the 'Restore from a backup' card (below the chosen file row with a file name like studyflow-data-2026-10-01.json and the Import button), a GREEN success panel reporting 'Imported 3 rows' with created/updated counts and a per-collection list (Subjects: 1 created, Tasks: 2). Readable, no overlap.",
  },
  {
    file: "s23-export-import-card-mobile.png",
    expect: "A MOBILE (390px) data-export page: the 'Export Your Data' header, count cards in a narrow stacked grid, and the 'Restore from a backup' card with the file row and Import button — all fitting the narrow viewport with NO horizontal overflow.",
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
