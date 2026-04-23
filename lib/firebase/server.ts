import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminAuth: ReturnType<typeof getAuth>;
let adminDb: ReturnType<typeof getFirestore>;

if (getApps().length === 0) {
  if (process.env.FIREBASE_PROJECT_ID) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    adminAuth = getAuth();
    adminDb = getFirestore();
  } else {
    // Prevent crashes during Vercel's build phase where env vars are missing
    console.warn("Firebase Admin credentials missing. Skipping init (safe during build).");
    adminAuth = {} as any;
    adminDb = {} as any;
  }
} else {
  adminAuth = getAuth();
  adminDb = getFirestore();
}

export { adminAuth, adminDb };

/**
 * Verify a user's Firebase ID token from the Authorization header.
 * Returns the decoded token if valid, null if not.
 */
export async function verifyAuthToken(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch {
    return null;
  }
}
