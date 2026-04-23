import { adminDb } from '@/lib/firebase/server';

interface VerificationAttempt {
  ip: string;
  studentId: string;
  action: 'VERIFIED_SCAN' | 'FAILED_VERIFY';
  userId?: string;
  details?: Record<string, unknown>;
}

const SUSPICIOUS_THRESHOLD = 10; // failures per hour per IP
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Antigravity Intelligence Agent
 * Logs every verification attempt and detects suspicious IPs analyzing students.
 */
export async function analyzeAndLog(attempt: VerificationAttempt): Promise<{
  suspicious: boolean;
  reason?: string;
}> {
  // Log to audit_logs
  await adminDb.collection('audit_logs').add({
    student_id: attempt.studentId,
    action: attempt.action,
    actor_ip: attempt.ip,
    actor_user_id: attempt.userId ?? null,
    details: attempt.details ?? {},
    created_at: new Date().toISOString(),
  });

  // Only analyze failed attempts for suspicious behavior
  if (attempt.action !== 'FAILED_VERIFY') {
    return { suspicious: false };
  }

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const snapshot = await adminDb.collection('audit_logs')
    .where('actor_ip', '==', attempt.ip)
    .where('action', '==', 'FAILED_VERIFY')
    .where('created_at', '>=', since)
    .get();

  const count = snapshot.size;

  if (count >= SUSPICIOUS_THRESHOLD) {
    // Log the suspicious event
    await adminDb.collection('audit_logs').add({
      student_id: attempt.studentId,
      action: 'SUSPICIOUS',
      actor_ip: attempt.ip,
      details: {
        reason: 'Exceeded failed verification threshold',
        count,
        window: '1 hour',
      },
      created_at: new Date().toISOString(),
    });

    return {
      suspicious: true,
      reason: `IP ${attempt.ip} has ${count} failed verifications in the last hour`,
    };
  }

  return { suspicious: false };
}
