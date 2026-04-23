import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE = 'aageis_admin_session';

export async function verifyAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  
  if (!session) return false;
  return session === process.env.ADMIN_SESSION_SECRET;
}

export function verifyAdminPassword(password: string) {
  return password === process.env.ADMIN_PASSWORD;
}

/**
 * Robust Native TOTP Verification (No external dependencies)
 * This avoids the 'otplib' build errors entirely.
 */
export function verifyTOTP(token: string) {
  const secret = process.env.ADMIN_TOTP_SECRET;
  if (!secret) return false;

  try {
    // 1. Base32 decode the secret
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (let i = 0; i < secret.length; i++) {
        const val = base32chars.indexOf(secret.charAt(i).toUpperCase());
        if (val >= 0) bits += val.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }
    const key = Buffer.from(bytes);

    // 2. Check current and neighboring time steps (for drift)
    const epoch = Math.floor(Date.now() / 1000);
    const timeSteps = [Math.floor(epoch / 30), Math.floor(epoch / 30) - 1, Math.floor(epoch / 30) + 1];

    for (const step of timeSteps) {
        const timeBuffer = Buffer.alloc(8);
        timeBuffer.writeBigInt64BE(BigInt(step));

        const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();
        const offset = hmac[hmac.length - 1] & 0xf;
        const code = ((hmac[offset] & 0x7f) << 24) |
                     ((hmac[offset + 1] & 0xff) << 16) |
                     ((hmac[offset + 2] & 0xff) << 8) |
                     (hmac[offset + 3] & 0xff);

        if ((code % 1000000).toString().padStart(6, '0') === token) {
            return true;
        }
    }
    return false;
  } catch (err) {
    console.error('TOTP Error:', err);
    return false;
  }
}
