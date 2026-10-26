// ---------------------------------------------------------------------------
// V6/F2 + F2b — client-side image intake for the product photo and the store
// logo. The clone stores data URLs (SQLite-friendly, zero infrastructure —
// SD-9): a canvas resize keeps every stored image small (~30-80KB), while a
// hard source guard rejects pathological files with a typed reason the views
// render inline. The guard half is pure (unit-pinned); the resize half needs
// the browser canvas and is covered by e2e.
// ---------------------------------------------------------------------------

/** The largest source file accepted (bytes). */
export const MAX_IMAGE_BYTES = 300 * 1024;

/** Images are stored at most this wide/tall (px) before JPEG re-encode. */
export const MAX_IMAGE_DIMENSION = 512;

export type ImageGuard =
  | { ok: true }
  | { ok: false; reason: "not-an-image" | "too-large" };

/** Pure source validation — shared by both upload call sites. */
export function validateImageFile(file: { size: number; type: string }): ImageGuard {
  if (!file.type.startsWith("image/")) return { ok: false, reason: "not-an-image" };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, reason: "too-large" };
  return { ok: true };
}

export type ImageResult =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: "not-an-image" | "too-large" | "decode-failed" };

/**
 * Reads a picked image into a storable data URL: draw to a canvas capped at
 * MAX_IMAGE_DIMENSION on its long edge, then re-encode as JPEG q0.85 (the
 * POS's photos are product shots — alpha is not a concern; JPEG keeps the
 * payload ~4x smaller than PNG). Runs entirely client-side.
 */
export async function fileToDataUrl(file: File): Promise<ImageResult> {
  const guard = validateImageFile(file);
  if (!guard.ok) return guard;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return { ok: false, reason: "decode-failed" };
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return { ok: true, dataUrl: canvas.toDataURL("image/jpeg", 0.85) };
  } catch {
    return { ok: false, reason: "decode-failed" };
  }
}
