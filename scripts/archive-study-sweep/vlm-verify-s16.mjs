// VLM-verify the S16 mobile evidence captures (smoke check for the
// remediated mobile auth geometry + the CLS-fixed dashboard surface).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "s16-login-mobile-signin.png",
    expect: "A mobile (narrow) login card centered on a soft gradient background: a circular gradient logo, the title 'Welcome to StudyFlow' with subtitle 'Sign in to continue', a 'Continue with Google' button, an 'or' divider, Email and Password fields, a full-width dark 'Sign in' button, and demo-account helper text below. No horizontal clipping or overlap.",
  },
  {
    file: "s16-login-mobile-signup.png",
    expect: "A mobile signup screen: a 'Back to sign in' link at top-left, a centered 'Create your account' heading, Email / Password / Confirm Password fields, and a full-width dark 'Create account' button. Filled values visible in the fields. No horizontal clipping.",
  },
  {
    file: "s16-login-mobile-verify.png",
    expect: "A mobile email-verification screen: 'Back to sign in' at top-left, a centered circular icon in a light slate circle, the heading 'Verify your email', a line 'We've sent a 6-digit code to <email>', six single-digit OTP boxes in a centered row, a 'Verify email' button, a 'Resend' option, and a muted note mentioning the code. No clipping.",
  },
  {
    file: "s16-login-mobile-forgot.png",
    expect: "A mobile reset-password screen: 'Back to sign in' at top-left, the heading 'Reset your password', helper copy 'Enter your email and we'll send you a link to reset your password', an Email field, and a full-width 'Send reset link' button.",
  },
  {
    file: "s16-login-mobile-check-email.png",
    expect: "A mobile check-email screen: a centered circular envelope icon, the heading 'Check your email', a line 'We've sent password reset instructions to <email>', a GREEN success alert box, a full-width 'Back to sign in' button, and a muted note about the reset link.",
  },
  {
    file: "s16-dashboard-mobile.png",
    expect: "A mobile dashboard: a fixed glass top bar with hamburger + StudyFlow brand and a live clock, a greeting heading 'Good evening, Demo Student', a red-ish overdue banner with an icon and 'View All', four stat cards in a 2-column grid (Today's Progress, Pending Tasks, Due Soon, Focus Time), and task/exam/assignment sections below. No layout overlap.",
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
            { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
            {
              type: "text",
              text: `Does this screenshot match this description? Answer PASS or FAIL with one short sentence.\nDescription: ${c.expect}`,
            },
          ],
        },
      ],
    });
    console.log(`${c.file}: ${res.choices[0]?.message?.content?.slice(0, 200) ?? "(no reply)"}`);
  } catch (e) {
    console.log(`${c.file}: VLM unavailable (${String(e).slice(0, 80)})`);
  }
}
