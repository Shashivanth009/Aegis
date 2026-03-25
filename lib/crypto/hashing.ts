import { createHash } from 'crypto';

/**
 * Generate a SHA-256 hash of the given buffer.
 * @param buffer - File content as a Buffer
 * @returns Hex string of the SHA-256 hash
 */
export function generateHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Compare two hashes in constant time to prevent timing attacks.
 */
export function compareHashes(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
