// ---------------------------------------------------------------------------
// The HTTP layer seam: error responses, the error→status mapper, the
// authed-handler wrappers, the entity CRUD route factories, and the
// download-header builder. Route files stay 3-line shells over the
// factories (AGENTS.md "API pattern").
//
// Error contract (PAD §6.2): Zod → 400, Prisma P2002 → 409, P2025 → 404,
// unauthed → 401, unknown → 500 with the detail logged server-side ONLY
// (the response never carries a stack or provider message).
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError, type ZodType } from "zod";

import type { SessionUser } from "./auth";
import { requireUser } from "./auth";

// ---- typed control-flow errors -----------------------------------------------

/** Thrown by the auth seam; mapped to 401 by the wrappers below. */
export class UnauthorizedError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "UnauthorizedError";
  }
}

/** Thrown by the delegates' ownership pre-check; mapped to 404. */
export class NotFoundError extends Error {
  constructor(message = "That record does not exist.") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Thrown by parseWith; carries the Zod issues for the 400 message. */
export class ValidationError extends Error {
  issues: ZodError["issues"];
  constructor(message: string, issues: ZodError["issues"] = []) {
    super(message);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

/** M4: request body exceeds the 1MB read budget (413). */
export class PayloadTooLargeError extends Error {
  constructor(message = "The request body is too large.") {
    super(message);
    this.name = "PayloadTooLargeError";
  }
}

/** M4: the request declares a non-JSON content type (415). */
export class UnsupportedMediaTypeError extends Error {
  constructor(message = "Expected a JSON body.") {
    super(message);
    this.name = "UnsupportedMediaTypeError";
  }
}

/** R2: the payload violates a business rule after parsing (422). */
export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessRuleError";
  }
}

/** R2: the resource state conflicts with the request (409). */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/** Format the first Zod issue: `field: message` (the refine copies carry no
 *  path and surface verbatim — the schemas' messages ARE the copy). */
function formatZodError(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request.";
  const path = issue.path.join(".");
  return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
}

// ---- responses -----------------------------------------------------------------

export function errorResponse(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function rateLimitedResponse(
  retryAfterSec: number,
  message: string,
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfterSec)) } },
  );
}

/** Parse a request body through its Zod schema; failure → ValidationError. */
export function parseWith<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(formatZodError(result.error), result.error.issues);
  }
  return result.data;
}

/** The single body-read budget — 1MB (M4: no unbounded pre-auth reads). */
const MAX_BODY_BYTES = 1024 * 1024;

/** Read a JSON body defensively: non-JSON content types → 415, declared
 *  bodies over 1MB → 413, malformed JSON → the caller's 400 path. Absent
 *  content-type and empty bodies are tolerated (same-origin app posts and
 *  the optional-payload routes). Accepts plain `Request` — NextRequest is
 *  a subclass, and only headers/text are touched. */
export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type");
  if (contentType !== null && contentType.trim() !== "") {
    const mime = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
    if (mime !== "" && mime !== "application/json" && !mime.endsWith("+json")) {
      throw new UnsupportedMediaTypeError();
    }
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new PayloadTooLargeError();
  }
  const text = await request.text();
  if (text.length === 0) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ValidationError("The request body is not valid JSON.");
  }
}

// ---- the error mapper ------------------------------------------------------------

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof UnauthorizedError) {
    return errorResponse(401, err.message);
  }
  if (err instanceof ValidationError) {
    return errorResponse(400, err.message);
  }
  if (err instanceof PayloadTooLargeError) {
    return errorResponse(413, err.message);
  }
  if (err instanceof UnsupportedMediaTypeError) {
    return errorResponse(415, err.message);
  }
  if (err instanceof BusinessRuleError) {
    return errorResponse(422, err.message);
  }
  if (err instanceof ConflictError) {
    return errorResponse(409, err.message);
  }
  if (err instanceof NotFoundError) {
    return errorResponse(404, err.message);
  }
  // H1: delegates call Zod `.parse` directly — a raw ZodError here is a
  // validation failure, not a server fault. Map it to the contracted 400
  // (single root fix; the message shape matches parseWith's).
  if (err instanceof ZodError) {
    return errorResponse(400, formatZodError(err));
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return errorResponse(409, "That record already exists.");
    }
    if (err.code === "P2025") {
      return errorResponse(404, "That record does not exist.");
    }
    if (err.code === "P2003") {
      return errorResponse(400, "That record references something that does not exist.");
    }
  }
  // Unknown → 500; the detail is logged server-side only (never the body).
  console.error("[api] unhandled error:", err);
  return errorResponse(500, "Something went wrong. Please try again.");
}

// ---- the authed-handler wrappers ---------------------------------------------------

type AuthedHandler = (
  user: SessionUser,
  request: NextRequest,
) => Promise<NextResponse | Response>;

/** Wrap a context-less route handler with the requireUser gate + error map. */
export function withUser(handler: AuthedHandler) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const user = await requireUser();
      return await handler(user, request);
    } catch (err: unknown) {
      return toErrorResponse(err);
    }
  };
}

type ItemRouteContext = { params: Promise<{ id: string }> };
type AuthedItemHandler = (
  user: SessionUser,
  request: NextRequest,
  id: string,
) => Promise<NextResponse | Response>;

/** Wrap an item route handler (Next 15+/16: params arrive as a Promise). */
export function withUserParams(handler: AuthedItemHandler) {
  return async (request: NextRequest, context: ItemRouteContext): Promise<Response> => {
    try {
      const { id } = await context.params;
      const user = await requireUser();
      return await handler(user, request, id);
    } catch (err: unknown) {
      return toErrorResponse(err);
    }
  };
}

// ---- the CRUD route factories -------------------------------------------------------

export type EntityDelegate = {
  list: (userId: string) => Promise<unknown[]>;
  create: (userId: string, input: unknown) => Promise<unknown>;
  update: (userId: string, id: string, input: unknown) => Promise<unknown>;
  remove: (userId: string, id: string) => Promise<unknown>;
};

/** Collection routes: GET list + POST create. */
export function makeCollectionRoutes(delegate: EntityDelegate) {
  const GET = withUser(async (user) => {
    const rows = await delegate.list(user.id);
    return NextResponse.json(rows);
  });
  const POST = withUser(async (user, request) => {
    const row = await delegate.create(user.id, await readJson(request));
    return NextResponse.json(row, { status: 201 });
  });
  return { GET, POST };
}

/** Item routes: PATCH update + DELETE remove. */
export function makeItemRoutes(delegate: EntityDelegate) {
  const PATCH = withUserParams(async (user, request, id) => {
    const row = await delegate.update(user.id, id, await readJson(request));
    return NextResponse.json(row);
  });
  const DELETE = withUserParams(async (user, _request, id) => {
    await delegate.remove(user.id, id);
    return NextResponse.json({ ok: true });
  });
  return { PATCH, DELETE };
}

// ---- the download-header builder (S13-C3) --------------------------------------------

/**
 * Content-Disposition for downloads: an ASCII-safe quoted fallback
 * (RFC 2183 — quotes/backslashes/non-ASCII neutralized, never terminated
 * early) plus the RFC 5987 extended form `filename*=UTF-8''…` carrying the
 * exact original name percent-encoded. The quoted form NEVER carries raw
 * percent-encoding of a unicode name (the historical bug: browsers saved
 * the literal "%D1%84..." filename).
 */
export function buildContentDisposition(filename: string): string {
  const safe = filename.trim().length > 0 ? filename : "download";
  const fallback = safe
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_");
  const extended = encodeURIComponent(safe);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${extended}`;
}

// ---- shared download-header sets -------------------------------------------------------

/** The S13/S14 download contract: attachment + nosniff + private no-store. */
export function downloadHeaders(filename: string, contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Content-Disposition": buildContentDisposition(filename),
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  };
}
