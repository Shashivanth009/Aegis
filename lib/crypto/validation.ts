export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'application/pdf': ['25504446'], // %PDF
  'image/png': ['89504e47'],       // PNG
  'image/jpeg': ['ffd8ff'],        // JPEG
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validate a file by checking its magic bytes (not just extension),
 * MIME type, and size. Returns a ValidationResult.
 */
export function validateFile(
  buffer: Buffer,
  declaredMime: string,
  sizeBytes: number
): ValidationResult {
  // 1. Size check
  if (sizeBytes > MAX_SIZE_BYTES) {
    return { valid: false, error: `File exceeds maximum size of 5MB (got ${(sizeBytes / 1024 / 1024).toFixed(2)}MB)` };
  }

  // 2. MIME type allowed?
  const allowedMagic = ALLOWED_MIME_TYPES[declaredMime];
  if (!allowedMagic) {
    return { valid: false, error: `File type '${declaredMime}' is not allowed. Use PDF, PNG, or JPEG.` };
  }

  // 3. Magic bytes check — validate actual file content, not just extension
  const hexHeader = buffer.subarray(0, 4).toString('hex').toLowerCase();
  const magicMatches = allowedMagic.some((magic) => hexHeader.startsWith(magic));
  if (!magicMatches) {
    return {
      valid: false,
      error: `File content does not match declared type '${declaredMime}'. Possible file spoofing detected.`,
    };
  }

  return { valid: true };
}

/**
 * Validate that a string is a valid UUID v4 format.
 * Used on all ID inputs to prevent path traversal or injection.
 */
export function validateUUID(id: string): boolean {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return UUID_REGEX.test(id);
}
