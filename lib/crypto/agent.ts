import { createSupabaseServerClient } from '@/lib/supabase/server';

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
  const supabase = createSupabaseServerClient();

  // Log to audit_logs
  await supabase.from('audit_logs').insert({
    student_id: attempt.studentId,
    action: attempt.action,
    actor_ip: attempt.ip,
    actor_user_id: attempt.userId ?? null,
    details: attempt.details ?? {},
  });

  // Only analyze failed attempts for suspicious behavior
  if (attempt.action !== 'FAILED_VERIFY') {
    return { suspicious: false };
  }

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('actor_ip', attempt.ip)
    .eq('action', 'FAILED_VERIFY')
    .gte('created_at', since);

  if ((count ?? 0) >= SUSPICIOUS_THRESHOLD) {
    // Log the suspicious event
    await supabase.from('audit_logs').insert({
      student_id: attempt.studentId,
      action: 'SUSPICIOUS',
      actor_ip: attempt.ip,
      details: {
        reason: 'Exceeded failed verification threshold',
        count,
        window: '1 hour',
      },
    });

    return {
      suspicious: true,
      reason: `IP ${attempt.ip} has ${count} failed verifications in the last hour`,
    };
  }

  return { suspicious: false };
}
