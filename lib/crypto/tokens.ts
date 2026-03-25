import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = () => {
  const s = process.env.HMAC_SECRET;
  if (!s) throw new Error('HMAC_SECRET not configured');
  return s;
};

/**
 * Generate a signed verification token for a certificate ID.
 * Token format: base64url(id:timestamp):hmac
 * The raw certificate ID is never exposed in URLs.
 */
export function generateVerifyToken(certId: string): string {
  const payload = Buffer.from(`${certId}:${Date.now()}`).toString('base64url');
  const hmac = createHmac('sha256', SECRET()).update(payload).digest('base64url');
  return `${payload}.${hmac}`;
}

/**
 * Validate a verification token and extract the certificate ID.
 * Returns null if the token is invalid or tampered.
 */
export function validateVerifyToken(token: string): string | null {
  try {
    const [payload, providedHmac] = token.split('.');
    if (!payload || !providedHmac) return null;

    // Constant-time HMAC comparison to prevent timing attacks
    const expectedHmac = createHmac('sha256', SECRET()).update(payload).digest('base64url');
    const a = Buffer.from(providedHmac);
    const b = Buffer.from(expectedHmac);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    // Decode payload → extract certId
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    const colonIdx = decoded.lastIndexOf(':');
    if (colonIdx === -1) return null;

    const certId = decoded.substring(0, colonIdx);
    return certId || null;
  } catch {
    return null;
  }
}
