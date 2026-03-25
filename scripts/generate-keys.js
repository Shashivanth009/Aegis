const { generateKeyPairSync } = require('crypto');

console.log('Generating 2048-bit RSA Key Pair for AEGIS...\n');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

console.log('--- ADD THESE TO YOUR .env.local FILE ---\n');
console.log(`RSA_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"\n`);
console.log(`RSA_PUBLIC_KEY="${publicKey.replace(/\n/g, '\\n')}"\n`);
