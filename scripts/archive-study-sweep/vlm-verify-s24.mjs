// VLM-verify the S24 dev-server captures (the remediated codebase renders
// the Settings Profile tab with the Change password card in every mode).
// Per the S9 lesson: VLM findings are hypotheses — DOM probes are the
// authority (the capture script's chrome reads are the DOM-side truth).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "s24-change-password-light.png",
    expect: "A desktop settings page on a light background, Profile tab active: an account card with 'Your account and study information', an avatar, Display name / School Name inputs, a Grade Level select, a Daily Study Goal slider, Save Profile and Sign out buttons, an Account created line — AND BELOW it a separate 'Change password' card with Current password / New password / Confirm new password fields and an Update Password gradient button. Readable, no overlap or clipping.",
  },
  {
    file: "s24-change-password-dark.png",
    expect: "The SAME settings Profile page rendered in DARK MODE (dark background, light text): the account card with its inputs and buttons, AND the separate 'Change password' card below with its three password fields and the Update Password button — all readable on the dark background, no overlap or clipping.",
  },
  {
    file: "s24-change-password-success.png",
    expect: "The settings Profile page with a COMPLETED password change: inside the 'Change password' card, a small GREEN success line reading 'Password updated.' under the three (now empty) password fields, with the Update Password button disabled (fields empty). The account card above renders normally. Readable, no overlap.",
  },
  {
    file: "s24-change-password-mobile.png",
    expect: "A MOBILE (390px) settings Profile page: the account card (avatar, Display name, School Name, Grade Level, study-goal slider, Save Profile / Sign out) AND the 'Change password' card with its three stacked password fields and the Update Password button — all fitting the narrow viewport with NO horizontal overflow.",
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
