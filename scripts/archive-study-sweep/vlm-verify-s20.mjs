// VLM-verify the S20 RUM panel v3 captures (sparklines + export action).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "s20-rum-panel-light.png",
    expect: "A desktop diagnostics page on a light background: a header with a purple-gradient square icon, the heading 'Performance Diagnostics', a 'Back to app' link, an 'Export CSV' button/link, and a Refresh button. Below: a samples line, FIVE metric cards in a row (Time to First Byte, First Contentful Paint, Largest Contentful Paint, Cumulative Layout Shift, Interaction to Next Paint) each with a value, a colored rating badge (green/amber/red), AND A SMALL TREND LINE (a thin violet sparkline chart) inside the card. Below: a recent-samples table (Metric, Value, Rating, Path, When) and a footer. No overlap or clipping.",
  },
  {
    file: "s20-rum-panel-dark.png",
    expect: "The same Performance Diagnostics page rendered in DARK MODE: near-black background, dark slate cards, light text, the five metric cards each carrying a value, a rating badge, and a visible LIGHT-COLORED sparkline trend line, plus the 'Export CSV' action in the header and the recent-samples table with light text on dark rows. Readable contrast throughout.",
  },
  {
    file: "s20-rum-panel-mobile.png",
    expect: "The Performance Diagnostics page on a MOBILE (narrow 390px) viewport: the header stacked, the five metric cards STACKED VERTICALLY (full width) each with value, rating badge, and a full-width sparkline trend line, the 'Export CSV' action visible, and the recent-samples table below with NO horizontal page overflow. No overlap.",
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
