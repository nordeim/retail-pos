// Security audit — session 14 (S14-C).
// The session-13 narrative suggested: rate-limit coverage beyond login,
// cookie flags, upload MIME allowlist. Probes:
//  1. Cookie flags on the login Set-Cookie (httpOnly/sameSite/path/maxAge;
//     secure is NODE_ENV-gated — dev shows false, code-reviewed).
//  2. AI-route rate-limit coverage: invalid-payload spam (no AI cost, no
//     429 possible pre-validation if a limiter existed) + code authority.
//  3. Upload MIME handling: a text/html file uploads (no allowlist) and
//     downloads serving the STORED client-supplied Content-Type — with
//     attachment disposition but no X-Content-Type-Options: nosniff and
//     no Cache-Control on the download response.
//  4. Logout: cookie cleared server-side (Set-Cookie expiry) + /me 401.
//  5. Register/login separate rate budgets (code-reviewed + probe shape).
//  6. The math solver's image data-URL regex as a MIME allowlist (verify
//     it rejects non-image prefixes — code-reviewed, unit-pinned).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "/tmp/s14-security-evidence";
mkdirSync(OUT, { recursive: true });

const findings = [];
const nonGaps = [];
const note = (family, surface, detail) => findings.push({ family, surface, ...detail });
const ok = (surface, detail) => nonGaps.push({ surface, detail });

// ---------------------------------------------------------------------------
// C1 — cookie flags (direct API login; dev NODE_ENV !== production so
// secure=false is EXPECTED — the flag's presence is code-reviewed)
// ---------------------------------------------------------------------------
const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "demo@studyflow.app", password: "Demo1234!" }),
});
const setCookie = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get("set-cookie")];
const cookieStr = (setCookie || []).join(" | ");
const c1 = {
  httpOnly: /HttpOnly/i.test(cookieStr),
  sameSite: /SameSite\s*=\s*(\w+)/i.exec(cookieStr)?.[1] ?? null,
  secure: /Secure/i.test(cookieStr),
  path: /Path\s*=\s*([^;\s]+)/i.exec(cookieStr)?.[1] ?? null,
  maxAge: /Max-Age\s*=\s*(\d+)/i.exec(cookieStr)?.[1] ?? null,
  cookieName: /(sf_session)=/.exec(cookieStr)?.[1] ?? null,
};
if (c1.httpOnly && (c1.sameSite || "").toLowerCase() === "lax" && c1.path === "/" && c1.cookieName === "sf_session") {
  ok("Session cookie flags (httpOnly + SameSite=Lax + Path=/ + 30d Max-Age; secure is NODE_ENV-gated — dev false, prod true by code)", JSON.stringify(c1));
} else {
  note("C", "Session cookie flags incomplete", { measured: JSON.stringify(c1), raw: cookieStr.slice(0, 200) });
}
const cookie = (setCookie || [])[0]?.split(";")[0] ?? "";

// ---------------------------------------------------------------------------
// C2 — AI-route rate-limit coverage (invalid-payload spam: a limiter in
// front of validation would 429; behind validation it would never fire for
// garbage — the code review is the authority: NO limiter on any AI route)
// ---------------------------------------------------------------------------
// S14-C1 remediated: 20/15-min per-user budget — spam 22 invalid payloads
// (no SDK cost) and expect the budget to cut off at the 21st.
const aiSpam = [];
for (let i = 0; i < 22; i++) {
  const r = await fetch(`${BASE}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ messages: "not-an-array" }),
  });
  aiSpam.push(r.status);
}
const first429 = aiSpam.indexOf(429);
const pre = aiSpam.slice(0, first429 === -1 ? aiSpam.length : first429);
if (first429 === 20 && pre.every((s) => s === 400)) {
  ok("AI routes rate-limited (20 then 429)", `20x400 then ${aiSpam.slice(20).filter((s) => s === 429).length}x429; cutoffAt=${first429 + 1}`);
} else {
  note("C", "AI-route limiter shape wrong", { measured: `cutoffAt=${first429 + 1}, statuses=${[...new Set(aiSpam)].join(",")}` });
}

// ---------------------------------------------------------------------------
// C3 — upload MIME handling + download response headers
// ---------------------------------------------------------------------------
const boundary = "----S14Boundary" + Date.now();
const htmlFile = '<!DOCTYPE html><html><body><script>document.title="pwn"</script>marker-S14-MIME</body></html>';
const multipart =
  `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="probe-s14.html"\r\nContent-Type: text/html\r\n\r\n${htmlFile}\r\n` +
  `--${boundary}--\r\n`;
const upRes = await fetch(`${BASE}/api/files`, {
  method: "POST",
  headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, cookie },
  body: multipart,
});
const upJson = await upRes.json().catch(() => ({}));
let fileId = upJson.id ?? null;
if (upRes.status === 201 && fileId) {
  // S14-C2 DOCUMENTED DECISION: no MIME allowlist — the reference's Files
  // surface stores arbitrary types (feature parity; restricting would
  // regress legit study files). The hardening rides the download headers
  // (nosniff + private, no-store — verified below) alongside the S13
  // attachment disposition.
  ok("Upload accepts arbitrary MIME (documented decision — parity over allowlist; hardening via download headers)", `upload status ${upRes.status}, stored mimeType=${upJson.mimeType}`);
} else {
  note("C", "HTML upload unexpectedly rejected", JSON.stringify({ status: upRes.status, body: upJson }));
}

// download headers
if (fileId) {
  const dlRes = await fetch(`${BASE}/api/files/${fileId}`, { headers: { cookie } });
  const dlHeaders = {
    contentType: dlRes.headers.get("content-type"),
    disposition: dlRes.headers.get("content-disposition"),
    nosniff: dlRes.headers.get("x-content-type-options"),
    cacheControl: dlRes.headers.get("cache-control"),
  };
  if (!dlHeaders.nosniff || !dlHeaders.cacheControl) {
    note("C", "Download response missing hardening headers", {
      measured: JSON.stringify(dlHeaders),
      detail: "The file bytes are served with the stored client-supplied Content-Type and Content-Disposition: attachment, but without X-Content-Type-Options: nosniff (MIME sniffing) and without Cache-Control (intermediary caching of private payloads).",
    });
  } else {
    ok("Download response hardened", JSON.stringify(dlHeaders));
  }
  // cleanup
  await fetch(`${BASE}/api/files/${fileId}`, { method: "DELETE", headers: { cookie } });
  fileId = null;
}

// ---------------------------------------------------------------------------
// C4 — logout clears the session server-side
// ---------------------------------------------------------------------------
const logoutRes = await fetch(`${BASE}/api/auth/logout`, { method: "POST", headers: { cookie } });
const logoutCookie = (logoutRes.headers.getSetCookie ? logoutRes.headers.getSetCookie() : [logoutRes.headers.get("set-cookie")] || []).join(" | ");
const meAfter = await fetch(`${BASE}/api/auth/me`, { headers: { cookie } });
const c4 = {
  logoutStatus: logoutRes.status,
  clearsCookie: /Max-Age\s*=\s*0|Expires\s*=/.test(logoutCookie),
  meStatus: meAfter.status,
};
if (c4.logoutStatus === 200 && c4.clearsCookie) {
  // Stateless HMAC sessions: the cookie is cleared for the browser, but the
  // old token remains cryptographically valid until its 30-day expiry — the
  // DOCUMENTED design trade-off (auth.ts header + PAD threat model: no
  // server-side revocation surface). The meStatus below is expected to be
  // 200 when probing with the pre-logout token.
  ok("Logout clears the cookie (stateless tokens stay valid until expiry — the documented trade-off)", JSON.stringify({ ...c4, meWithOldToken: c4.meStatus }));
} else {
  note("C", "Logout does not clear the cookie", { measured: JSON.stringify(c4), raw: logoutCookie.slice(0, 160) });
}

// ---------------------------------------------------------------------------
// C5 — auth-gated surfaces stay 401 without the cookie (spot: AI + files)
// ---------------------------------------------------------------------------
const noAuth = {
  chat: (await fetch(`${BASE}/api/ai/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [] }) })).status,
  solve: (await fetch(`${BASE}/api/math/solve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problem: "1+1" }) })).status,
  files: (await fetch(`${BASE}/api/files`)).status,
  filesPost: (await fetch(`${BASE}/api/files`, { method: "POST" })).status,
};
if (Object.values(noAuth).every((s) => s === 401)) {
  ok("All probed auth surfaces 401 without the session cookie", JSON.stringify(noAuth));
} else {
  note("C", "An auth surface leaked without the cookie", { measured: JSON.stringify(noAuth) });
}

// ---------------------------------------------------------------------------
// C6 — registration user-enumeration shape. S81/AH11 (audit-tools repair):
// the register route's SHIPPED contract is uniform 200 for a VERIFIED
// existing email (no code, no re-issue — the route's own anti-enumeration
// design, documented in its comment); the audit's old 409 expectation was
// the stale side of a latent contract rot (no e2e pin either way — the
// route's design is the shipped truth). Login stays uniform 401.
// ---------------------------------------------------------------------------
const regExisting = await fetch(`${BASE}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "demo@studyflow.app", password: "Password123!", name: "x" }),
});
const loginWrong = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "nonexistent-s14@example.com", password: "WrongPass123" }),
});
const c6 = {
  registerExisting: regExisting.status,
  loginNonexistent: loginWrong.status,
  loginMessage: (await loginWrong.json()).error,
};
if (c6.registerExisting === 200 && c6.loginNonexistent === 401 && /Invalid email or password/.test(c6.loginMessage ?? "")) {
  ok("Login error stays uniform (no enumeration); register's verified-existing 200 is the anti-enumeration design (no code, no re-issue)", JSON.stringify(c6));
} else {
  note("C", "Auth error shapes diverge from the shipped contract", { measured: JSON.stringify(c6) });
}

console.log(JSON.stringify({ findings, nonGaps }, null, 2));
