/**
 * Authoritative Server-Synchronized Exam Timer Utility.
 *
 * Solves client/server clock skew and ensures that exam countdowns
 * are strictly grounded in the database/server authoritative timestamp.
 */

export interface AttemptWithServerTime {
  attempt: any;
  serverNowMs: number;
  remainingSeconds: number;
}

/**
 * Fetches an exam attempt from Supabase and calculates remaining time
 * using the authoritative HTTP Date response header from the server.
 */
export async function getAttemptWithServerTime(attemptId: string): Promise<AttemptWithServerTime | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase environment variables are missing.');
  }

  const endpoint = `${supabaseUrl}/rest/v1/exam_attempts?id=eq.${encodeURIComponent(attemptId)}&select=*,subject:subjects(*)`;

  const res = await fetch(endpoint, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  const attempt = data?.[0] || null;
  if (!attempt) {
    return null;
  }

  // Extract authoritative server timestamp from HTTP Date header
  const dateHeader = res.headers.get('date');
  let serverNowMs = dateHeader ? Date.parse(dateHeader) : NaN;
  if (isNaN(serverNowMs)) {
    serverNowMs = Date.now();
  }

  const expiresMs = Date.parse(attempt.expires_at);
  const maxDurationSec = (attempt.duration_minutes || 90) * 60;

  let remainingSeconds: number;
  if (isNaN(expiresMs)) {
    remainingSeconds = maxDurationSec;
  } else {
    const rawRemaining = Math.floor((expiresMs - serverNowMs) / 1000);
    // Never allow negative or greater than configured exam duration
    remainingSeconds = Math.max(0, Math.min(maxDurationSec, rawRemaining));
  }

  return {
    attempt,
    serverNowMs,
    remainingSeconds,
  };
}
