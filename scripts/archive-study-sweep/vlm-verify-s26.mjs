// VLM-verify the S26 dev-server captures (the remediated codebase renders
// the Settings Profile tab with the Email address card in every mode).
// Per the S9 lesson: VLM findings are hypotheses — DOM probes are the
// authority (the capture script's chrome reads are the DOM-side truth).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "s26-change-email-light.png",
    expect: "A desktop settings page on a light background, Profile tab active: an account card with 'Your account and study information', an avatar with a name and email line, Display name / School Name inputs, a Grade Level select, a Daily Study Goal slider, Save Profile and Sign out buttons, an Account created line — an 'Email address' card with a New email field, a Confirm new email field, a Password field and an 'Update email address' gradient button — BELOW it a 'Change password' card with three password fields — and BELOW that a 'Danger zone' card with a red-outlined 'Delete account…' button. Readable, no overlap or clipping.",
  },
  {
    file: "s26-change-email-dark.png",
    expect: "The SAME settings Profile page rendered in DARK MODE (dark background, light text): the account card, the 'Email address' card with its three fields and gradient button, the 'Change password' card, AND the 'Danger zone' card — all readable on the dark background, no overlap or clipping.",
  },
  {
    file: "s26-change-email-success.png",
    expect: "The settings Profile page with the Email address card in its SUCCESS state: a green 'Email address updated.' note visible inside the 'Email address' card, the three input fields now EMPTY, and the identity block at the top of the account card showing an email address containing 's26-demo-capture'. The 'Change password' and 'Danger zone' cards render below. Readable, no overlap.",
  },
  {
    file: "s26-change-email-mobile.png",
    expect: "A MOBILE (390px) settings Profile page: the account card (avatar, Display name, School Name, Grade Level, study-goal slider, Save Profile / Sign out), the 'Email address' card with its three stacked fields and 'Update email address' button, the 'Change password' card, AND the 'Danger zone' card — all fitting the narrow viewport with NO horizontal overflow.",
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
