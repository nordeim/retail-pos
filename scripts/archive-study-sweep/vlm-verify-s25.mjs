// VLM-verify the S25 dev-server captures (the remediated codebase renders
// the Settings Profile tab with the Danger zone card in every mode).
// Per the S9 lesson: VLM findings are hypotheses — DOM probes are the
// authority (the capture script's chrome reads are the DOM-side truth).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "s25-delete-account-light.png",
    expect: "A desktop settings page on a light background, Profile tab active: an account card with 'Your account and study information', an avatar, Display name / School Name inputs, a Grade Level select, a Daily Study Goal slider, Save Profile and Sign out buttons, an Account created line — a 'Change password' card with three password fields and an Update Password gradient button — AND BELOW BOTH a separate 'Danger zone' card with a red-outlined 'Delete account…' button and a warning paragraph mentioning permanently deleting the account and its data. Readable, no overlap or clipping.",
  },
  {
    file: "s25-delete-account-dark.png",
    expect: "The SAME settings Profile page rendered in DARK MODE (dark background, light text): the account card, the 'Change password' card, AND the separate 'Danger zone' card below with its red 'Delete account…' button and warning text — all readable on the dark background, no overlap or clipping.",
  },
  {
    file: "s25-delete-account-revealed.png",
    expect: "The settings Profile page with the Danger zone card's confirmation form REVEALED: inside the 'Danger zone' card, a Password field, a Confirmation field with the placeholder 'Type DELETE', a red 'Permanently delete my account' button, and a Cancel button. The account card and the 'Change password' card render normally above. Readable, no overlap.",
  },
  {
    file: "s25-delete-account-mobile.png",
    expect: "A MOBILE (390px) settings Profile page: the account card (avatar, Display name, School Name, Grade Level, study-goal slider, Save Profile / Sign out), the 'Change password' card with its three stacked password fields, AND the 'Danger zone' card with the red 'Delete account…' button and its warning paragraph — all fitting the narrow viewport with NO horizontal overflow.",
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
