// #25 (incremental): AI client layer extracted from App.tsx so the god-component
// shrinks and these are unit-testable in isolation.
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';

/** STEP2: server-authoritative debate close. null when Firebase isn't configured
 *  → App.tsx falls back to client-side close. */
export const closeDebateFn = functions
  ? httpsCallable<{ roomId: string }, { ok?: boolean; winner?: string }>(functions, 'closeDebate')
  : null;

/** #2: POST to an /api/ai/* endpoint with the caller's Firebase ID token attached,
 *  so the endpoints aren't an open, unauthenticated Claude proxy. */
export async function aiFetch(path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  try {
    const u = auth?.currentUser;
    if (u) headers['Authorization'] = `Bearer ${await u.getIdToken()}`;
  } catch {
    /* no token — request 401s and the caller's existing error path handles it */
  }
  return fetch(path, {
    method: 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Tidy a debate utterance via /api/ai/polish; falls back to the raw text. */
export async function polishText(raw: string): Promise<string> {
  try {
    const r = await aiFetch('/api/ai/polish', { text: raw });
    if (!r.ok) throw new Error('polish failed');
    const { text } = await r.json();
    return typeof text === 'string' && text.length > 0 ? text : raw;
  } catch (e) {
    console.error('[polish] fallback to raw', e);
    return raw;
  }
}
