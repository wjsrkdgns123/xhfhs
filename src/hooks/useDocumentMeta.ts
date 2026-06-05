import { useEffect } from 'react';

const BASE_URL = 'https://ddatebattle.site';
const DEFAULT_TITLE = '토론배틀 — 찬성 VS 반대 1대1 실시간 토론';
const DEFAULT_DESC =
  '찬성 vs 반대, 1대1 실시간 한국어 토론배틀. AI 사회자와 청중 투표로 승부가 갈립니다.';
const DEFAULT_PATH = '/';

/** 단일 meta 요소를 찾거나 없으면 생성하는 헬퍼. 중복 방지를 위해 selector로 탐색한다. */
function getOrCreateMeta(selector: string, attrs: Record<string, string>): HTMLMetaElement {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
    document.head.appendChild(el);
  }
  return el;
}

/** canonical link 요소를 찾거나 없으면 생성한다. */
function getOrCreateCanonical(): HTMLLinkElement {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  return el;
}

/**
 * SPA 뷰별 문서 메타를 동기화한다.
 * - title / description (기존)
 * - canonical, og:url, og:title, og:description, twitter:title, twitter:description (신규)
 * 언마운트 시 루트 기본값으로 복원한다.
 */
export function useDocumentMeta(
  title?: string,
  description?: string,
  canonicalPath?: string,
) {
  useEffect(() => {
    // ── 이전 값 저장 ──────────────────────────────────────────────
    const prevTitle = document.title;

    const descEl = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const prevDesc = descEl?.content;

    const canonicalEl = getOrCreateCanonical();
    const prevCanonical = canonicalEl.href;

    const ogUrlEl    = getOrCreateMeta('meta[property="og:url"]',         { property: 'og:url', content: '' });
    const ogTitleEl  = getOrCreateMeta('meta[property="og:title"]',       { property: 'og:title', content: '' });
    const ogDescEl   = getOrCreateMeta('meta[property="og:description"]', { property: 'og:description', content: '' });
    const twTitleEl  = getOrCreateMeta('meta[name="twitter:title"]',      { name: 'twitter:title', content: '' });
    const twDescEl   = getOrCreateMeta('meta[name="twitter:description"]',{ name: 'twitter:description', content: '' });

    const prevOgUrl   = ogUrlEl.content;
    const prevOgTitle = ogTitleEl.content;
    const prevOgDesc  = ogDescEl.content;
    const prevTwTitle = twTitleEl.content;
    const prevTwDesc  = twDescEl.content;

    // ── 현재 뷰 값 적용 ───────────────────────────────────────────
    const resolvedTitle = title ?? DEFAULT_TITLE;
    const resolvedDesc  = description ?? DEFAULT_DESC;
    const resolvedPath  = canonicalPath ?? DEFAULT_PATH;
    const resolvedUrl   = BASE_URL + resolvedPath;

    document.title = resolvedTitle;
    if (descEl) descEl.content = resolvedDesc;

    canonicalEl.href  = resolvedUrl;
    ogUrlEl.content   = resolvedUrl;
    ogTitleEl.content = resolvedTitle;
    ogDescEl.content  = resolvedDesc;
    twTitleEl.content = resolvedTitle;
    twDescEl.content  = resolvedDesc;

    // ── 언마운트 시 루트 기본값 복원 ─────────────────────────────
    return () => {
      document.title = prevTitle;
      if (descEl && prevDesc !== undefined) descEl.content = prevDesc;

      canonicalEl.href  = prevCanonical;
      ogUrlEl.content   = prevOgUrl;
      ogTitleEl.content = prevOgTitle;
      ogDescEl.content  = prevOgDesc;
      twTitleEl.content = prevTwTitle;
      twDescEl.content  = prevTwDesc;
    };
  }, [title, description, canonicalPath]);
}
