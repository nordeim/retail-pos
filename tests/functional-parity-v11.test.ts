import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Pins for remediation-plan-v11 (session V11, 2026-10-27) — three families,
// every one measured LIVE on both apps (agent-browser, viewports 1440/1280/
// 1024/390; see docs/remediation-plan-v11.md §0):
//
// F1 the chart CONTAINER geometry: the reference's recharts
//    ResponsiveContainers re-wrap the viewBox to the CONTAINER width while
//    the chart height stays FIXED per surface (dashboard sales 280, reports
//    sales 220, donut 200) and the donut's ring radii stay FIXED (innerR 50
//    / outerR 80, cy 100, cx = box/2, the box capped at 333). The clone's
//    fixed-viewBox SVGs scaled uniformly (640×260/640×280 aspect-locked;
//    the donut's ring shrank with the box) — at 1280 the dashboard chart
//    rendered 254px tall vs the ref's 280, the reports chart 424px vs the
//    ref's 220, the donut ring 134px vs the ref's 160.
//
// F2 the form-control chrome family: the ref's app-surface controls focus
//    with ring-1 (1px #7f62f4 edge, NO offset) — not the shadcn ring-2 +
//    2px-offset indigo halo; the Input/Textarea/Select bases carry
//    text-base md:text-sm + shadow-sm (+ rounded-xl on textarea/select);
//    the label→control gap is mt-1; the Switch is ring-2 + offset-2 in the
//    SOLID #7f62f4 over the #0f121a surface; the glass buttons recolor the
//    browser focus outline violet; the auth inputs focus slate-400 over a
//    WHITE offset with pl-10 / h-11 sm:h-12 / md:text-sm / slate-600
//    placeholders; the auth root swaps --background to white; the auth
//    submit carries a 3px white outline. Root tokens: --ring/--primary
//    127 98 244, --background 15 18 26, --border 38 42 54.
//
// F3 the chart tooltips: the ref's charts render the recharts default
//    tooltip on hover (white card, 12px radius, 10px padding, shadow
//    rgba(0,0,0,0.1) 0 4px 20px, nowrap, pointer-events none) — the clone
//    adopts the measured skin with readable dark text (the ref's own
//    light-on-white tooltip text is unreadable — the SD-18 precedent).
// Pins written RED first.
// ---------------------------------------------------------------------------

const root = resolve(import.meta.dirname, "..");
const src = (p: string) => readFileSync(resolve(root, p), "utf8");

const shared = () => src("src/components/pos/shared.tsx");
const globals = () => src("src/app/globals.css");
const input = () => src("src/components/ui/input.tsx");
const textarea = () => src("src/components/ui/textarea.tsx");
const select = () => src("src/components/ui/select.tsx");
const button = () => src("src/components/ui/button.tsx");
const switchSrc = () => src("src/components/ui/switch.tsx");
const loginSurface = () => src("src/components/auth/login-surface.tsx");
const signupSurface = () => src("src/components/auth/signup-surface.tsx");
const dashboardView = () => src("src/components/views/dashboard-view.tsx");
const reportsView = () => src("src/components/views/reports-view.tsx");
const settingsView = () => src("src/components/views/settings-view.tsx");
const inventoryView = () => src("src/components/views/inventory-view.tsx");
const registersView = () => src("src/components/views/registers-view.tsx");
const cashiersView = () => src("src/components/views/cashiers-view.tsx");

// ---- B1/F1 — the responsive chart containers ---------------------------------

describe("B1/F1 — the charts are container-responsive the recharts way", () => {
  it("useContainerWidth measures at commit (callback ref) and observes resizes (RO + React 19 cleanup)", () => {
    const s = shared();
    // The callback-ref measure (synchronous, before first paint — no flash).
    expect(s).toContain("useContainerWidth");
    expect(s).toMatch(/getBoundingClientRect\(\)\.width/);
    // The ResizeObserver for later resizes, disconnected via the React 19
    // ref-cleanup return.
    expect(s).toContain("new ResizeObserver");
    expect(s).toContain("ro.disconnect()");
  });

  it("SalesAreaChart renders the measured box: per-variant FIXED heights, width from the container", () => {
    const s = shared();
    // The per-surface fixed heights (dashboard 280, reports 220 — the ref's
    // own heights at every measured viewport; the 640×260/640×280
    // aspect-locked boxes retire).
    expect(s).toMatch(/dashboard:\s*280/);
    expect(s).toMatch(/reports:\s*220/);
    // The box template — width from the measured container, not a constant.
    expect(s).toMatch(/viewBox=\{`0 0 \$\{width\} \$\{height\}`\}/);
    expect(s).toMatch(/width=\{width\}/);
    expect(s).toMatch(/height=\{height\}/);
    // The aspect-lock class is gone (w-full h-auto scaled uniformly).
    expect(s).not.toContain('"h-auto w-full"');
    // The internal paddings stay FIXED while the plot area flexes.
    expect(s).toContain("padLeft = 52");
    expect(s).toContain("padBottom = 28");
    expect(s).toContain("padTop = 12");
  });

  it("DonutChart keeps the ring FIXED and re-wraps the box (cx = box/2, cap 333)", () => {
    const s = shared();
    // The box cap — the ref's max-width 333 container.
    expect(s).toMatch(/max-w-\[333px\]|maxWidth:\s*333/);
    // The ring geometry is FIXED (the radii and cy never scale with the box).
    expect(s).toMatch(/innerR = 50/);
    expect(s).toMatch(/outerR = 80/);
    expect(s).toMatch(/cy = 100/);
    // The center follows the box (recharts' 50% default — at the 333 cap
    // cx = 166.5, matching the v10 measurement).
    expect(s).toMatch(/cx = box\/2|const cx = box \/ 2/);
    // The box template.
    expect(s).toMatch(/viewBox=\{`0 0 \$\{box\} 200`\}/);
    // The literal fixed box is gone.
    expect(s).not.toContain('viewBox="0 0 333 200"');
  });

  it("the chart call sites let the variant own the height (no height overrides)", () => {
    // The reports call site passed height={280} — the variant owns it now.
    expect(reportsView()).not.toContain("height={280}");
    expect(dashboardView()).not.toContain("height=");
  });
});

// ---- B2/F2 — the form-control chrome family ----------------------------------

describe("B2/F2 — the focus system + control bases match the reference", () => {
  it("the root tokens align: --ring/--primary #7f62f4, --background #0f121a, --border #262a36", () => {
    const g = globals();
    expect(g).toMatch(/--ring:\s*127 98 244/);
    expect(g).toMatch(/--primary:\s*127 98 244/);
    expect(g).toMatch(/--background:\s*15 18 26/);
    expect(g).toMatch(/--border:\s*38 42 54/);
  });

  it("the Input base is the reference's: ring-1 no-offset, text-base md:text-sm, shadow-sm", () => {
    const s = input();
    expect(s).toContain("focus-visible:ring-1 focus-visible:ring-ring");
    expect(s).not.toContain("focus-visible:ring-2");
    expect(s).not.toContain("ring-offset-2");
    expect(s).toContain("text-base");
    expect(s).toContain("md:text-sm");
    expect(s).toContain("shadow-sm");
    expect(s).toContain("rounded-xl");
  });

  it("the Textarea base is the reference's: rounded-xl, py-2, ring-1, text-base md:text-sm, shadow-sm", () => {
    const s = textarea();
    expect(s).toContain("rounded-xl");
    expect(s).not.toContain("rounded-md");
    expect(s).toContain("px-3 py-2 ");
    expect(s).toContain("focus-visible:ring-1 focus-visible:ring-ring");
    expect(s).not.toContain("ring-offset-2");
    expect(s).toContain("text-base");
    expect(s).toContain("md:text-sm");
    expect(s).toContain("shadow-sm");
  });

  it("the SelectTrigger base is the reference's: rounded-xl, focus:ring-1 (the focus: spelling)", () => {
    const s = select();
    // The TRIGGER block (the first className in the file — the panel below
    // stays rounded-md, the reference's own 6px dropdown panel, verified
    // live: its popper content measures border-radius 6px).
    const triggerBlock = s.slice(0, s.indexOf("SelectPrimitive.Icon"));
    expect(triggerBlock).toContain("rounded-xl");
    expect(triggerBlock).not.toContain("rounded-md");
    expect(triggerBlock).toContain("focus:outline-none focus:ring-1 focus:ring-ring");
    expect(triggerBlock).not.toContain("focus-visible:ring-2");
    expect(triggerBlock).not.toContain("ring-offset-2");
    // The dropdown PANEL keeps the reference's rounded-md (6px).
    const contentBlock = s.slice(s.indexOf("SelectPrimitive.Portal"));
    expect(contentBlock).toContain("rounded-md");
  });

  it("the cva Button base carries NO focus ring (the glass utilities own the outline)", () => {
    const s = button();
    expect(s).not.toContain("focus-visible:ring-2");
    expect(s).not.toContain("ring-offset-2");
  });

  it("the glass utilities recolor the browser focus outline violet", () => {
    const g = globals();
    expect(g).toMatch(/outline:\s*3px solid rgba\(127, 98, 244, 0\.5\)/);
  });

  it("the Switch focuses ring-2 + offset-2 in the SOLID #7f62f4", () => {
    const s = switchSrc();
    expect(s).toContain("focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2");
    expect(s).not.toContain("#7f62f4]/40");
    expect(s).toContain("data-[state=checked]:bg-[#7f62f4]");
  });

  it("the label→control gap is the reference's mt-1 (4px) — mt-1.5 retires", () => {
    for (const [name, file] of [
      ["settings", settingsView()],
      ["inventory", inventoryView()],
      ["registers", registersView()],
      ["cashiers", cashiersView()],
    ] as const) {
      expect(file, `${name}-view still carries mt-1.5 on a control`).not.toContain("mt-1.5");
    }
  });

  it("the Ajustes ticket footer uses the Textarea component (the raw ring-ring/45 retires)", () => {
    const s = settingsView();
    expect(s).toContain("<Textarea");
    expect(s).not.toContain("ring-ring/45");
  });
});

// ---- B3/F2 — the auth surface's own focus system ------------------------------

describe("B3/F2 — the auth inputs carry the reference's light-theme focus", () => {
  it("the inputs focus slate-400 over a white offset with the measured base", () => {
    for (const [name, file] of [
      ["login", loginSurface()],
      ["signup", signupSurface()],
    ] as const) {
      expect(file, `${name} focus ring`).toContain("focus:border-slate-400 focus:ring-slate-400");
      expect(file, `${name} icon gutter`).toContain("pl-10");
      expect(file, `${name} heights`).toContain("h-11");
      expect(file, `${name} heights`).toContain("sm:h-12");
      expect(file, `${name} placeholder`).toContain("placeholder:text-slate-600");
    }
    // The 16px-mobile/14px-desktop text comes from the Input BASE
    // (text-base md:text-sm — pinned in B2); the auth call sites inherit it.
  });

  it("the auth surface scopes --background to white (the ring-offset renders white)", () => {
    // The shared AuthShell (login-surface) carries the scoped token; the
    // signup page renders through the SAME shell (imported). The value is
    // the RGB-triplet white (this repo's token convention — the reference's
    // own "0 0% 100%" is the HSL form in ITS theme).
    const l = loginSurface();
    const s = signupSurface();
    expect(l).toMatch(/--background":\s*"255 255 255"/);
    expect(s).toContain('<AuthShell>');
    expect(s).toContain('from "@/components/auth/login-surface"');
  });

  it("the auth submit buttons carry the measured 3px white outline", () => {
    const l = loginSurface();
    const s = signupSurface();
    expect(l).toContain("outline-[3px]");
    expect(s).toContain("outline-[3px]");
  });
});

// ---- B4/F3 — the chart tooltips ------------------------------------------------

describe("B4/F3 — the charts render the reference's measured tooltip skin", () => {
  it("the tooltip card is the recharts default skin: white, 12px radius, 10px padding, the measured shadow", () => {
    const s = shared();
    expect(s).toContain("ChartTooltip");
    // The measured skin (live on the ref's sales chart).
    expect(s).toMatch(/background:\s*#fff|backgroundColor:\s*"#fff"|background:\s*"rgb\(255, 255, 255\)"/);
    expect(s).toMatch(/borderRadius:\s*12/);
    expect(s).toMatch(/padding:\s*10/);
    expect(s).toMatch(/rgba\(0, 0, 0, 0\.1\) 0 4px 20px|0px 4px 20px/);
    expect(s).toMatch(/whiteSpace:\s*"nowrap"/);
    expect(s).toMatch(/pointerEvents:\s*"none"/);
  });

  it("both charts track the pointer and show the label (+ the value, the readable superset)", () => {
    const s = shared();
    // Pointer tracking on both charts.
    expect(s.match(/onPointerMove/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(s).toContain("onPointerLeave");
    // The sales tooltip carries the day's total; the donut the category count.
    expect(s).toContain("tooltipForSales");
    expect(s).toContain("tooltipForDonut");
  });
});
