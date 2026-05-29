// #2: Verify a Firebase ID token at the Cloudflare edge so the AI endpoints
// are not an open, unauthenticated proxy to Claude. Hand-rolled RS256 JWT
// verification via Web Crypto (no Node deps — runs on Workers/Pages Functions).
//
// ⚠️ UNTESTED DRAFT (authored without a live test harness). Verify end-to-end
// before merging to main: a logged-in user should still get AI responses, and
// a request without a valid Bearer token should get 401.

const PROJECT_ID = 'controversy-4d3ea'; // public Firebase project id (also in client bundle)
const JWK_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
}

let cachedKeys: { keys: Jwk[]; exp: number } | null = null;

async function getKeys(): Promise<Jwk[]> {
  const now = Date.now();
  if (cachedKeys && cachedKeys.exp > now) return cachedKeys.keys;
  const r = await fetch(JWK_URL);
  if (!r.ok) throw new Error(`jwk fetch ${r.status}`);
  const data = (await r.json()) as { keys: Jwk[] };
  const cc = r.headers.get('cache-control') ?? '';
  const m = cc.match(/max-age=(\d+)/);
  const ttl = m ? Number(m[1]) * 1000 : 3_600_000;
  cachedKeys = { keys: data.keys, exp: now + Math.max(60_000, ttl) };
  return data.keys;
}

function b64urlToBytes(s: string): Uint8Array {
  let b = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  const bin = atob(b);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function decodeJson(seg: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(seg))) as Record<string, unknown>;
}

/** Verify a Firebase ID token; returns the uid (sub) or throws. */
export async function verifyFirebaseIdToken(token: string): Promise<string> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('malformed jwt');
  const header = decodeJson(parts[0]) as { alg?: string; kid?: string };
  if (header.alg !== 'RS256' || !header.kid) throw new Error('bad header');

  const payload = decodeJson(parts[1]) as {
    aud?: string;
    iss?: string;
    exp?: number;
    sub?: string;
  };
  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== PROJECT_ID) throw new Error('bad aud');
  if (payload.iss !== `https://securetoken.google.com/${PROJECT_ID}`) throw new Error('bad iss');
  if (!payload.sub) throw new Error('no sub');
  if (typeof payload.exp !== 'number' || payload.exp <= now) throw new Error('expired');

  const jwk = (await getKeys()).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('unknown kid');

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const ok = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlToBytes(parts[2]),
    signed,
  );
  if (!ok) throw new Error('bad signature');
  return payload.sub;
}

/** Extract + verify the Bearer token from a request. Returns uid or throws. */
export async function requireAuth(request: Request): Promise<string> {
  const header = request.headers.get('Authorization') ?? '';
  const m = header.match(/^Bearer (.+)$/);
  if (!m) throw new Error('missing bearer token');
  return verifyFirebaseIdToken(m[1]);
}
