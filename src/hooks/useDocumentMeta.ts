import { useEffect } from 'react';

const DEFAULT_TITLE = '토론배틀 — 찬성 VS 반대 1대1 실시간 토론';
const DEFAULT_DESC =
  '찬성 vs 반대, 1대1 실시간 한국어 토론배틀. AI 사회자와 청중 투표로 승부가 갈립니다.';

/**
 * Sync the browser tab title and the page meta description for the current
 * SPA view. Restores defaults on unmount so the next view's hook can take over
 * cleanly. Helps Googlebot index per-URL content with distinct titles.
 */
export function useDocumentMeta(title?: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    const descEl = document.querySelector(
      'meta[name="description"]',
    ) as HTMLMetaElement | null;
    const prevDesc = descEl?.content;

    if (title) document.title = title;
    else document.title = DEFAULT_TITLE;

    if (descEl) {
      descEl.content = description ?? DEFAULT_DESC;
    }

    return () => {
      document.title = prevTitle;
      if (descEl && prevDesc !== undefined) descEl.content = prevDesc;
    };
  }, [title, description]);
}
