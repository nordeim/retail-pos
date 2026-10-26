// ---------------------------------------------------------------------------
// Ticket numbers — the sale receipt identifiers. Pure — unit-pinned by
// tests/ticket.test.ts.
//
// Verified reference format (docs/reference-investigation.md §4.4):
// `V-` + 8 uppercase base-36 characters (samples V-MO6BJT7G, V-MMPNY55Z).
// The alphabet excludes easily-confused glyphs is NOT applied — both
// samples contain O/0-adjacent glyphs — so the full base-36 alphabet is
// used, matching the observed space.
// ---------------------------------------------------------------------------

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const TICKET_BODY_LENGTH = 8;

/** Cryptographically-random ticket body (8 uppercase base-36 chars). */
export function ticketBody(randomSource?: (len: number) => Uint8Array): string {
  const bytes =
    randomSource ??
    ((len: number) => {
      const out = new Uint8Array(len);
      globalThis.crypto.getRandomValues(out);
      return out;
    });
  const raw = bytes(TICKET_BODY_LENGTH);
  let out = "";
  for (let i = 0; i < TICKET_BODY_LENGTH; i += 1) {
    out += ALPHABET[raw[i] % ALPHABET.length];
  }
  return out;
}

/** `V-XXXXXXXX`. */
export function ticketNumber(randomSource?: (len: number) => Uint8Array): string {
  return `V-${ticketBody(randomSource)}`;
}

/** Shape guard for a ticket id (`V-` + exactly 8 base-36 chars). */
export function isTicketNumber(value: string): boolean {
  return /^V-[0-9A-Z]{8}$/.test(value);
}
