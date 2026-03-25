import { createSign, createVerify, generateKeyPairSync } from 'crypto';

const ALGORITHM = 'RSA-PSS';
const HASH = 'sha256';

/**
 * Generate a new RSA key pair (run once, store in env).
 * Output keys as PEM strings.
 */
export function generateKeyPair(): { privateKey: string; publicKey: string } {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { privateKey, publicKey };
}

/**
 * Sign a hex hash string with the RSA private key.
 * Private key is loaded from env var RSA_PRIVATE_KEY (PEM format).
 * @returns Base64-encoded signature
 */
export function signHash(hashHex: string): string {
  const privateKeyPem = process.env.RSA_PRIVATE_KEY;
  if (!privateKeyPem) throw new Error('RSA_PRIVATE_KEY not configured');

  const sign = createSign(HASH);
  sign.update(hashHex, 'utf8');
  sign.end();

  return sign.sign(
    {
      key: privateKeyPem,
      padding: require('crypto').constants.RSA_PKCS1_PSS_PADDING,
      saltLength: require('crypto').constants.RSA_PSS_SALTLEN_DIGEST,
    },
    'base64'
  );
}

/**
 * Verify a base64 signature against a hex hash.
 * Public key is loaded from env var RSA_PUBLIC_KEY (PEM format).
 */
export function verifySignature(hashHex: string, signatureBase64: string): boolean {
  try {
    const publicKeyPem = process.env.RSA_PUBLIC_KEY;
    if (!publicKeyPem) throw new Error('RSA_PUBLIC_KEY not configured');

    const verify = createVerify(HASH);
    verify.update(hashHex, 'utf8');
    verify.end();

    return verify.verify(
      {
        key: publicKeyPem,
        padding: require('crypto').constants.RSA_PKCS1_PSS_PADDING,
        saltLength: require('crypto').constants.RSA_PSS_SALTLEN_DIGEST,
      },
      signatureBase64,
      'base64'
    );
  } catch {
    return false;
  }
}
