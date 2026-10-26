// VLM-verify the S19 RUM diagnostics panel captures.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "s19-rum-panel-light.png",
    expect: "A desktop diagnostics page on a light background: a header row with a purple-gradient square icon, the heading 'Performance Diagnostics' with subtitle mentioning p75, a 'Back to app' link and a Refresh button. Below: a line about samples/events, FIVE metric cards in a row (Time to First Byte, First Contentful Paint, Largest Contentful Paint, Cumulative Layout Shift, Interaction to Next Paint) each with a value in ms or a decimal, and a colored rating badge (green 'good', amber 'needs improvement', or red 'poor'). Below the cards: a recent-samples table with columns Metric, Value, Rating, Path, When. A footer with good-bounds text. No overlap or clipping.",
  },
  {
    file: "s19-rum-panel-dark.png",
    expect: "The same Performance Diagnostics page rendered in DARK MODE: near-black background, dark slate cards, light text, the same five metric cards with rating badges, and the recent-samples table with light text on dark rows. Readable contrast throughout, no light flash artifacts.",
  },
  {
    file: "s19-rum-panel-mobile.png",
    expect: "The Performance Diagnostics page on a MOBILE (narrow 390px) viewport: the header stacked (icon + heading on one row, subtitle wrapping), the five metric cards STACKED VERTICALLY (one per row, full width), and the recent-samples table below (possibly with clipped/truncated path column but no horizontal page overflow). No overlap.",
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
