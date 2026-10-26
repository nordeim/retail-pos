import { describe, expect, it } from "vitest";

import { readJson } from "@/lib/server/http";

// ---------------------------------------------------------------------------
// R1/M4 — readJson body gates: the pre-remediation reader accepted unbounded
// bodies and any content type. The 413/415 gates land here, RED first.
// ---------------------------------------------------------------------------

/** readJson touches only request.headers + request.text() — a duck-typed
 *  stub keeps the unit independent of undici's forbidden-header rules. */
function stubRequest(headers: Record<string, string>, body: string): Request {
  return {
    headers: new Headers(headers),
    text: async () => body,
  } as unknown as Request;
}

describe("readJson body gates (M4)", () => {
  it("accepts a JSON content type with a valid body", async () => {
    await expect(
      readJson(stubRequest({ "content-type": "application/json" }, `{"a":1}`)),
    ).resolves.toEqual({ a: 1 });
  });

  it("tolerates an absent content type (same-origin app posts)", async () => {
    await expect(
      readJson(stubRequest({}, `{"a":2}`)),
    ).resolves.toEqual({ a: 2 });
  });

  it("maps an empty body to {} (the optional-payload routes)", async () => {
    await expect(readJson(stubRequest({}, ""))).resolves.toEqual({});
  });

  it("rejects a non-JSON content type with 415 semantics", async () => {
    await expect(
      readJson(stubRequest({ "content-type": "text/plain" }, "hello")),
    ).rejects.toMatchObject({ name: "UnsupportedMediaTypeError" });
    await expect(
      readJson(stubRequest({ "content-type": "multipart/form-data; boundary=x" }, "x")),
    ).rejects.toMatchObject({ name: "UnsupportedMediaTypeError" });
  });

  it("rejects an oversized content-length with 413 semantics", async () => {
    await expect(
      readJson(
        stubRequest(
          { "content-type": "application/json", "content-length": String(1024 * 1024 + 1) },
          "{}",
        ),
      ),
    ).rejects.toMatchObject({ name: "PayloadTooLargeError" });
  });

  it("accepts exactly 1MB (the boundary rides the inclusive side)", async () => {
    await expect(
      readJson(
        stubRequest(
          { "content-type": "application/json", "content-length": String(1024 * 1024) },
          `{"a":1}`,
        ),
      ),
    ).resolves.toEqual({ a: 1 });
  });

  it("keeps malformed JSON on the 400 path (ValidationError)", async () => {
    await expect(
      readJson(stubRequest({ "content-type": "application/json" }, "not json")),
    ).rejects.toMatchObject({ name: "ValidationError" });
  });
});
