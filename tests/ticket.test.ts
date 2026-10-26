// ---------------------------------------------------------------------------
// Ticket identifiers: `V-` + 8 uppercase base-36 chars (verified samples:
// V-MO6BJT7G, V-MMPNY55Z).
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";

import { isTicketNumber, ticketBody, ticketNumber, TICKET_BODY_LENGTH } from "@/lib/ticket";

describe("ticketNumber", () => {
  it("produces V-prefixed 8-char bodies", () => {
    for (let i = 0; i < 200; i += 1) {
      expect(isTicketNumber(ticketNumber())).toBe(true);
    }
  });

  it("uses only base-36 uppercase glyphs", () => {
    const body = ticketBody();
    expect(body).toMatch(/^[0-9A-Z]{8}$/);
    expect(body).toHaveLength(TICKET_BODY_LENGTH);
  });

  it("honors an injected random source (deterministic tests)", () => {
    const fixed = (len: number) => new Uint8Array(len).fill(0);
    expect(ticketBody(fixed)).toBe("00000000");
    expect(ticketNumber(fixed)).toBe("V-00000000");
  });

  it("maps out-of-alphabet bytes into range (no crashes)", () => {
    const big = (len: number) => new Uint8Array(len).fill(255);
    expect(ticketBody(big)).toMatch(/^[0-9A-Z]{8}$/);
  });
});

describe("isTicketNumber", () => {
  it("accepts the reference samples and rejects near-misses", () => {
    expect(isTicketNumber("V-MO6BJT7G")).toBe(true);
    expect(isTicketNumber("V-MMPNY55Z")).toBe(true);
    expect(isTicketNumber("V-MO6BJT7")).toBe(false); // 7 chars
    expect(isTicketNumber("V-mo6bjt7g")).toBe(false); // lowercase
    expect(isTicketNumber("X-MO6BJT7G")).toBe(false); // wrong prefix
    expect(isTicketNumber("")).toBe(false);
  });
});
