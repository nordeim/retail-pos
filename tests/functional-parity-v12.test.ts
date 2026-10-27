import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The V12 pins — the auth surface family, measured below the card level for
// the first time (docs/remediation-plan-v12.md §0 L4-L16):
//   F1 the auth card chrome (the 4px slate gradient hairline, overflow-hidden,
//      the md: padding variant, the space-y column)
//   F2 the login typography + layout grammar (the responsive H1/subtext, the
//      16px social buttons with the -ml-4 icon offset, the OR chip, the sm:
//      form gaps, the Forgot/Sign-up footer ROW inside the form, the
//      h-11 sm:h-12 submit)
//   F3 the forgot/sent screens (the reference's ENGLISH family + the measured
//      anatomy: the back-at-top, the 24px H2, the h-10 sm:h-11 controls, the
//      sent screen's icon circle + green alert)
//   F4 the /reset-password page (the platform template: the white page, the
//      rounded-lg card + the 2px gray-900 strip, the gray palette, the
//      New Password + Confirm pair, the invalid-token state)
//   F5 the alert family (the shadcn Alert shape: bg-X-50/70 border-X-200
//      rounded-xl p-4 + text-X-700 text-sm leading-relaxed)

const root = resolve(import.meta.dirname, "..");
const src = (p: string) => readFileSync(resolve(root, p), "utf8");

const loginSurface = () => src("src/components/auth/login-surface.tsx");
const signupSurface = () => src("src/components/auth/signup-surface.tsx");
const resetPage = () => src("src/app/reset-password/page.tsx");

// ---- B1/F1 — the auth card chrome ---------------------------------------------

describe("B1/F1 — the AuthShell card carries the reference's chrome", () => {
  it("the card has overflow-hidden (the hairline clips to the rounded corners)", () => {
    expect(loginSurface()).toContain("overflow-hidden rounded-2xl");
  });

  it("the 4px slate gradient hairline rides the card's top edge", () => {
    const s = loginSurface();
    expect(s).toContain("absolute top-0 left-0 right-0 h-1");
    expect(s).toContain("bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200");
  });

  it("the padding steps up at md (pt-12 pb-10 px-10)", () => {
    expect(loginSurface()).toContain("sm:p-10 md:pt-12 md:pb-10 md:px-10");
  });

  it("the inner column is the reference's space-y stack with text-center", () => {
    const s = loginSurface();
    expect(s).toContain("flex flex-col items-center text-center space-y-6 sm:space-y-8");
  });
});

// ---- B2/F2 — the login typography + layout grammar -------------------------------

describe("B2/F2 — the login grammar matches the reference's measured strings", () => {
  it("the H1 is responsive (24px mobile / 30px >= sm)", () => {
    expect(loginSurface()).toContain("text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl");
    expect(signupSurface()).toContain(
      "text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl",
    );
  });

  it("the subtext is responsive + medium (14/16px, 500)", () => {
    expect(loginSurface()).toContain("text-sm font-medium text-slate-500 sm:text-base");
  });

  it("the H1 + subtext ride the space-y-2 sm:space-y-3 wrapper", () => {
    expect(loginSurface()).toContain("space-y-2 sm:space-y-3");
  });

  it("the social buttons render 16px text with the measured hover family", () => {
    const s = loginSurface();
    expect(s).toContain("text-[16px]");
    expect(s).toContain("hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm");
  });

  it("the social icon wrapper carries the -ml-4 optical offset", () => {
    expect(loginSurface()).toContain("-ml-4");
  });

  it("the OR chip is the reference's (bg-white, slate-500, tracking-wider, literal 'or')", () => {
    const s = loginSurface();
    expect(s).toContain("text-xs uppercase");
    expect(s).toContain("bg-white px-3 font-medium tracking-wider text-slate-500");
    // The literal DOM text node "or" (uppercased by the wrapper's CSS).
    expect(s).toMatch(/>\s*or\s*</);
  });

  it("the form steps its gaps at sm (space-y-4 sm:space-y-5)", () => {
    expect(loginSurface()).toContain("space-y-4 sm:space-y-5");
  });

  it("the fields + actions ride their own groups (space-y-3 sm:space-y-4 / space-y-3)", () => {
    const s = loginSurface();
    expect(s).toContain("space-y-3 sm:space-y-4");
  });

  it("the Forgot/Sign-up footer row lives INSIDE the form as the sm:flex-row justify-between", () => {
    const s = loginSurface();
    expect(s).toContain("flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-0");
    // The row is inside the form element (after the submit), not a sibling.
    expect(s).toMatch(/flex flex-col items-center justify-between gap-2 sm:flex-row[\s\S]*?<\/form>/);
  });

  it("the footer buttons are the reference's auto-width text links", () => {
    const s = loginSurface();
    expect(s).toContain(
      "text-sm font-medium text-slate-500 transition-colors hover:text-slate-700",
    );
    expect(s).not.toContain("mt-4 w-full text-sm font-medium");
  });

  it("the submit is h-11 sm:h-12 with shadow-sm + transition-all (44px mobile)", () => {
    const s = loginSurface();
    expect(s).toContain(
      "h-11 w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200",
    );
    expect(s).toContain("sm:h-12");
    expect(s).not.toContain('"h-12 w-full');
  });
});

// ---- B3/F3 — the forgot + sent screens ------------------------------------------

describe("B3/F3 — the forgot/sent screens are the reference's English family", () => {
  it("the forgot screen: back-at-top with -mb-2, the 24px H2, the 16px slate-600 subtext", () => {
    const s = loginSurface();
    expect(s).toContain("Reset your password");
    expect(s).toContain("Enter your email and we&apos;ll send you a link to reset your password");
    expect(s).toContain("-mb-2");
  });

  it("the forgot controls are the SMALLER auth size (h-10 sm:h-11, placeholder slate-400)", () => {
    const s = loginSurface();
    expect(s).toContain("h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10");
    expect(s).toContain("sm:h-11");
    expect(s).toContain("placeholder:text-slate-400");
    expect(s).toContain("Send reset link");
  });

  it("the sent screen: the icon circle + the measured copy + the green alert", () => {
    const s = loginSurface();
    expect(s).toContain("Check your email");
    expect(s).toContain("h-14 w-14 items-center justify-center rounded-full bg-slate-100 sm:h-16 sm:w-16");
    expect(s).toContain("We've sent password reset instructions to");
    expect(s).toContain("border-green-200 bg-green-50/70 p-4");
    expect(s).toContain("text-green-700");
    expect(s).toContain("Please check your email for the password reset link.");
  });

  it("the sent screen's email renders as the font-medium slate-900 span", () => {
    expect(loginSurface()).toContain("font-medium text-slate-900");
  });

  it("the in-card reset screen RETIRES (no token field on the login surface)", () => {
    const s = loginSurface();
    expect(s).not.toContain("Código de restablecimiento");
    expect(s).not.toContain("Nueva contraseña");
    expect(s).not.toContain('"reset"');
  });

  it("the Spanish one-off copy is gone from the auth surfaces", () => {
    const s = loginSurface();
    for (const gone of [
      "Recuperar contraseña",
      "Te enviaremos",
      "Enviar enlace",
      "Volver a iniciar sesión",
      "Revisa tu correo",
      "Guardando…",
      "Enviando…",
    ]) {
      expect(s).not.toContain(gone);
    }
  });
});

// ---- B4/F4 — the /reset-password page -------------------------------------------

describe("B4/F4 — the reset page is the platform template", () => {
  it("the page is WHITE (no vx-auth-page gradient)", () => {
    expect(resetPage()).not.toContain("vx-auth-page");
  });

  it("the card is rounded-lg, solid white, shadow-lg, with the 2px gray-900 strip", () => {
    const s = resetPage();
    expect(s).toContain("rounded-lg");
    expect(s).toContain("shadow-lg");
    expect(s).toContain("h-0.5 bg-gray-900");
    expect(s).not.toContain("rounded-3xl");
    expect(s).not.toContain("indigo");
  });

  it("the copy is the reference's English pair", () => {
    const s = resetPage();
    expect(s).toContain("Set new password");
    expect(s).toContain("Enter your new password for VeloxPOS");
    expect(s).toContain("New Password");
    expect(s).toContain("Confirm New Password");
    expect(s).toContain("Must be at least 8 characters");
    expect(s).toContain("Reset password");
    expect(s).toContain("Back to login");
  });

  it("the gray palette: gray-50/50 inputs, gray focus, gray-400 lock icons", () => {
    const s = resetPage();
    expect(s).toContain("border-gray-200 bg-gray-50/50");
    expect(s).toContain("focus:border-gray-400 focus:ring-gray-400");
    expect(s).toContain("text-gray-400");
  });

  it("the inputs are h-11 with pl-10 (the lock gutter)", () => {
    const s = resetPage();
    expect(s).toContain("h-11");
    expect(s).toContain("pl-10");
  });

  it("the submit is the h-11 bg-gray-900 button; the back is the w-full gray-600 link", () => {
    const s = resetPage();
    expect(s).toContain("bg-gray-900 px-3 py-2");
    expect(s).toContain("hover:bg-gray-800");
    expect(s).toContain("block w-full text-sm text-gray-600 transition-colors hover:text-gray-700");
  });

  it("the missing/invalid token renders the reference's Invalid Reset Link state", () => {
    const s = resetPage();
    expect(s).toContain("Invalid Reset Link");
    expect(s).toContain("This password reset link is invalid or has expired.");
    expect(s).toContain("h-20 w-20 items-center justify-center rounded-full bg-red-100");
    expect(s).toContain("Back to Login");
  });
});

// ---- B5/F5 — the alert family ----------------------------------------------------

describe("B5/F5 — the alerts are the reference's shadcn Alert shape", () => {
  it("the error alert: red-50/70, red-200 border, 12px radius, p-4, red-700 text", () => {
    const s = loginSurface();
    expect(s).toContain("border-red-200 bg-red-50/70 p-4");
    expect(s).toContain("text-sm leading-relaxed text-red-700");
    expect(s).not.toContain("rounded-lg bg-red-50 px-3 py-2");
  });

  it("the alert's inner text family (leading-relaxed, text-sm)", () => {
    expect(loginSurface()).toContain("leading-relaxed");
  });

  it("signup's error boxes adopt the same family (no legacy red box)", () => {
    const s = signupSurface();
    expect(s).not.toContain("rounded-lg bg-red-50 px-3 py-2");
    expect(s).toContain("text-red-700");
  });

  it("signup rides the same grammar: responsive submit + English labels", () => {
    const s = signupSurface();
    expect(s).toContain("h-11 sm:h-12");
    expect(s).toContain("Full name");
    expect(s).toContain("Verification code");
    expect(s).not.toContain('"Nombre"');
    expect(s).not.toContain('"Código"');
  });
});
