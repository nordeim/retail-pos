#!/usr/bin/env bash
# Session-89 cold e2e certification — the 5-chunk map, final post-Batch-AU
# (census 470 → 474: s14-hardening +1 [the S94/AU1 A0c pin — the offline
# banner's light amber pair computes the pinned v3 hexes; trap-10 closed,
# the RED demonstrated live against the pre-change build — the unpinned
# amber-200 border serialized lab(91.7203…)] and dark-mode +3 [the
# S94/AU3 pins: AU3a the banner's dark amber pair incl. the
# raw-rgb()/0.6 border serialization, AU3b the RUM panel error alert's
# dark pair, AU3c the events dialog error banner's sf-alert-red dark
# pair]. The S89-era map beneath: [the header tag was stale at
# post-Batch-AP through the S90–S93 cycles — the parallel AT session
# updated only the Expected line it needed; re-tagged here honestly])
# (census 469 → 470: parity-session7 +1 [the S89/AP1 partial-empty zombie pin:
# the same rate-refresh external-deletion window as AO4 but a 2-of-3
# deletion — the surviving set is non-empty while the advanced study index
# runs past it; the unlatch condition now reads !studyCard, subsuming the
# all-gone case and the partial deletion. The AP2 s22-boot-guard change
# modifies the negative spawn IN-PLACE (the explicit-empty AUTH_SECRET —
# environment immunity against a real-secret workspace .env leaking
# through Next's standalone auto-load); census unchanged for it. The
# S88 map beneath:])
# (census 468 → 469: parity-session7 +1 [the S88/AO4 study-zombie pin: the
# deterministic external-deletion window drives the exact s80 L1 — mid-study
# the deck's cards empty through rate's own PATCH→GET refresh carrying a
# deletion between its legs; the empty deck's guard fall-through renders;
# a UI refill must NOT resurrect the latched study session — the pin was
# RED on the pre-fix build at the designed discriminator (the card grid
# never returns) and GREEN after the render-phase structural kill]. The
# S87/AO2 wraps modify four stamped pins IN-PLACE (AH8c + AI1a/b/c — the
# try/finally cleanup the AN1/AM5 convention established; dev-iterate
# hygiene only, cold-cert immune). The S87 map beneath:)
# (census UNCHANGED at 468: the S87/AN1 change modified the AM1 pin in-place
# [the stamped-row cleanup — the id rides the evaluate's return, the finally
# deletes it on the failing path; the AM5 convention applied to the pin AM5
# itself shipped], and the AN4 read-side-trim change is unit-pinned only
# [group-members +2 — the seam is pure]. The S86 map beneath:)
# (census: 30 spec files exactly once; the S86 addition rides in-place —
# parity-session8 +1 [the AM1 members-boundary API pin: a blank member
# name is rejected at the API — the seam/server trim alignment, the s86
# audit's L2]; the S85 additions beneath —
# parity-session8 +3 [the AL1 members family: seeded members render,
# add-member preserves, edit-save preserves] and accessibility +1 [the AL2
# Study Groups member avatar chip print pin]; the S84 map beneath: resilience
# 12 tests [the AJ1 folder pin + the AK1 guard family] and accessibility 84
# [the AJ5 print family + AJ6 focus pin + the AK2 print-enumeration closure
# + the AL2 chip]).
# Expected: 131 + 141 + 57 + 87 + 58 = 474 (each chunk's count includes its
# auth setup; 469 real specs = the S82 443 + the seven S83 pins + the eight
# S84 pins + the four S85 pins + the one S86 pin + the one S88 pin + the one
# S89 pin + the four S94 pins [A0c + AU3a/b/c] — S95/AV4a, the s94 audit's
# L3: the AU re-tag updated the sum but left the 470-era "465" stale).
# Per-chunk: fresh
# db/e2e.db + stale-server kill (fresh in-memory limiter, register budget
# stays <= 9/10 per chunk).
# (S84/AK3 header correction, the audit's L1: the S83 header said
# "resilience 8→9" and "444 + six S83 pins" — the empirical counts were
# 7→8 and 443+7=450; corrected here so the census stays re-derivable.)
set -uo pipefail
cd "$(dirname "$0")/.."

declare -a CHUNKS=(
  "tests/e2e/navigation.spec.ts tests/e2e/parity-session8.spec.ts tests/e2e/mobile-navigation.spec.ts"
  "tests/e2e/parity-session9.spec.ts tests/e2e/parity-session7.spec.ts tests/e2e/theme-system.spec.ts tests/e2e/parity-session6.spec.ts tests/e2e/a11y-sweep.spec.ts tests/e2e/tasks.spec.ts tests/e2e/s14-hardening.spec.ts"
  "tests/e2e/parity-session5.spec.ts tests/e2e/resilience.spec.ts tests/e2e/s16-perf-parity.spec.ts"
  "tests/e2e/accessibility.spec.ts tests/e2e/calculator.spec.ts tests/e2e/dark-mode.spec.ts tests/e2e/s17-fresh-user.spec.ts tests/e2e/s52-sidebar-collapse.spec.ts"
  "tests/e2e/auth.spec.ts tests/e2e/auth-flows.spec.ts tests/e2e/greeting-clock.spec.ts tests/e2e/s18-rum.spec.ts tests/e2e/s19-rum-panel.spec.ts tests/e2e/s20-rum-export.spec.ts tests/e2e/s21-data-export.spec.ts tests/e2e/s22-boot-guard.spec.ts tests/e2e/s23-import.spec.ts tests/e2e/s24-change-password.spec.ts tests/e2e/s25-delete-account.spec.ts tests/e2e/s26-change-email.spec.ts"
)

i=1
for chunk in "${CHUNKS[@]}"; do
  # stale-server kill (AP-70/AP-95: kill by exact match, never blanket pkill).
  # S91/AR2 (the s90 audit's M1): the standalone server RETITLES its process
  # to `next-server (v1.x)` after boot, so the old command-line grep matched
  # NOTHING for an already-booted server (the S90 lesson 5's own incident) —
  # and in practice it was a BLANKET match that also killed unrelated
  # standalone servers (a parallel :3200 verification host). The listening-
  # port kill replaces it entirely: PID by the E2E port only, curl-verified
  # dead, SIGKILL escalation if the TERM did not land. A non-listening
  # leftover cannot wedge the cert (playwright reuses only a HEALTHY
  # listener; a bind race fails loudly with EADDRINUSE, never silently).
  # S92/AS6 (the s91 audit's I1+I3): the post-escalation re-check — a
  # STILL-answering listener aborts the chunk loudly BEFORE the db delete
  # (never remove db/e2e.db under a live listener). NOTE (I3): the kill
  # toolchain (`ss -tlnp` + `grep -oP`) is Linux/GNU-specific — on BSD/macOS
  # the extraction silently no-ops; run the cert on Linux.
  port="${E2E_PORT:-3100}"
  pids=$(ss -tlnp 2>/dev/null | grep ":${port} " | grep -oP 'pid=\K[0-9]+' | sort -u)
  for p in $pids; do kill "$p" 2>/dev/null; done
  sleep 1
  if curl -s -o /dev/null --max-time 2 "http://localhost:${port}/api/health"; then
    # still listening after SIGTERM — escalate to SIGKILL on the port's PID
    for p in $pids; do kill -9 "$p" 2>/dev/null; done
    sleep 1
    # S92/AS6: the post-escalation dead-check — a still-answering listener
    # is a hard abort (the §18 lesson-16 class), never a silent db delete.
    if curl -s -o /dev/null --max-time 2 "http://localhost:${port}/api/health"; then
      echo "FATAL: :${port} still answers after the SIGKILL escalation — refusing to delete db/e2e.db under a live listener; kill PID(s) ${pids} manually and re-run"
      exit 1
    fi
  fi
  rm -f db/e2e.db
  echo "=== CHUNK $i: $(echo $chunk | wc -w) files ==="
  bunx playwright test $chunk --reporter=list 2>&1 | grep -E "^ *[0-9]+ (passed|failed)|passed|failed" | tail -3
  i=$((i + 1))
done
echo "=== DONE — chunked certification complete ==="
