/**
 * Root middleware — dynamic Open Graph / Twitter card injection for shared
 * debate-room links.
 *
 * WHY THIS EXISTS
 * ---------------
 * The app is a client-side-rendered Vite SPA. Link-preview crawlers
 * (Discord, X/Twitter, KakaoTalk, iMessage, Slack, Facebook) do NOT run
 * JavaScript, so the per-page <title>/description set by `useDocumentMeta`
 * in React is invisible to them. They only see the static index.html.
 *
 * This middleware rewrites the *static* index.html on the edge — using
 * Cloudflare's streaming HTMLRewriter — so that when someone shares
 *   https://ddatebattle.site/?room=<id>&src=<platform>&t=<encodeURIComponent(topic)>
 * the crawler receives a card titled with the actual debate topic.
 *
 * SAFETY / SCOPE
 * --------------
 * - Only intervenes on GET navigations (Accept: text/html) to the root path
 *   that carry BOTH `room` and `t` query params.
 * - Everything else (the AI API under /api/*, static assets, normal page
 *   loads, the no-topic fallback) is passed straight through via next().
 * - The topic value is length-capped and stripped of control chars; the
 *   actual HTML-attribute encoding is handled by HTMLRewriter.setAttribute,
 *   which escapes its value, so injected text cannot break out into markup.
 */

interface Env {
  [key: string]: unknown;
}

const SITE = 'https://ddatebattle.site';
const OG_IMAGE = `${SITE}/og-image.png`;

// Cap so a hostile/huge `t` can't bloat the response or the card.
const MAX_TOPIC_LEN = 120;

// ASCII control chars (0x00-0x1F and 0x7F). Built via the RegExp constructor
// so that no literal control characters ever appear in this source file.
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F]+', 'g');

/** Strip control chars, collapse whitespace, clamp length. Markup-escaping is
 *  handled later by HTMLRewriter.setAttribute, so this only keeps it sane. */
function cleanTopic(raw: string): string {
  const cleaned = raw
    .replace(CONTROL_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= MAX_TOPIC_LEN) return cleaned;
  return cleaned.slice(0, MAX_TOPIC_LEN - 1).trimEnd() + '…';
}

/** Pick KO vs EN copy from the (optional) lang hint or the topic itself. */
function isEnglish(lang: string | null, topic: string): boolean {
  if (lang) return lang.toLowerCase().startsWith('en');
  // Heuristic fallback: no Hangul at all → treat as English card.
  return !/[가-힣]/.test(topic);
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, next } = ctx;

  // 1) Only GET navigations can be link-preview fetches.
  if (request.method !== 'GET') return next();

  const url = new URL(request.url);

  // 2) Only the root document. (Assets, /api/*, /sw.js, etc. pass through.)
  if (url.pathname !== '/' && url.pathname !== '/index.html') return next();

  // 3) Must be an HTML navigation (crawlers/browsers send Accept: text/html).
  const accept = request.headers.get('Accept') || '';
  if (!accept.includes('text/html')) return next();

  // 4) Need both a room id and a topic to build a room-specific card.
  const room = url.searchParams.get('room');
  const rawTopic = url.searchParams.get('t');
  if (!room || !rawTopic) return next();

  const topic = cleanTopic(rawTopic);
  if (!topic) return next();

  // Fetch the static index.html that Pages would normally serve.
  const response = await next();

  // Defensive: only rewrite actual HTML responses.
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/html')) return response;

  const en = isEnglish(url.searchParams.get('lang'), topic);

  const title = en ? `Debate Battle · ${topic}` : `토론배틀 · ${topic}`;
  const desc = en
    ? 'Real-time 1:1 debate with an AI moderator — the audience votes for the winner. Join now!'
    : 'AI 사회자가 진행하는 1:1 실시간 토론. 청중 투표로 승자 결정! 지금 입장하기.';
  const canonical = `${SITE}/?room=${encodeURIComponent(room)}`;
  const locale = en ? 'en_US' : 'ko_KR';

  // HTMLRewriter escapes attribute values it sets, so `topic` is safe here.
  const rewriter = new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(title);
      },
    })
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute('content', title);
      },
    })
    .on('meta[property="og:description"]', {
      element(el) {
        el.setAttribute('content', desc);
      },
    })
    .on('meta[property="og:url"]', {
      element(el) {
        el.setAttribute('content', canonical);
      },
    })
    .on('meta[property="og:locale"]', {
      element(el) {
        el.setAttribute('content', locale);
      },
    })
    .on('meta[property="og:image"]', {
      element(el) {
        el.setAttribute('content', OG_IMAGE);
      },
    })
    .on('meta[name="twitter:title"]', {
      element(el) {
        el.setAttribute('content', title);
      },
    })
    .on('meta[name="twitter:description"]', {
      element(el) {
        el.setAttribute('content', desc);
      },
    })
    .on('meta[name="twitter:image"]', {
      element(el) {
        el.setAttribute('content', OG_IMAGE);
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute('content', desc);
      },
    })
    .on('link[rel="canonical"]', {
      element(el) {
        el.setAttribute('href', canonical);
      },
    });

  const transformed = rewriter.transform(response);

  // Don't let crawlers/CDN cache one room's card for another's URL.
  const headers = new Headers(transformed.headers);
  headers.set('Cache-Control', 'no-store');

  return new Response(transformed.body, {
    status: transformed.status,
    statusText: transformed.statusText,
    headers,
  });
};
