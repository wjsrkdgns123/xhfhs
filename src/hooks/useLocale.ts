import { useCallback, useEffect, useState } from 'react';
import type { Lang } from '../i18n/landing';

const STORAGE_KEY = 'debateBattle:lang';

/** Default to KO unless navigator hints English and no stored override. */
function detectInitial(): Lang {
  if (typeof window === 'undefined') return 'ko';
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (stored === 'ko' || stored === 'en') return stored;
  const nav = navigator.language?.toLowerCase() ?? '';
  return nav.startsWith('ko') ? 'ko' : nav.startsWith('en') ? 'en' : 'ko';
}

/**
 * Single shared locale state across the app. Persists to localStorage and
 * syncs `<html lang>` so screen readers and search engines see the right tag.
 */
export function useLocale() {
  const [lang, setLangState] = useState<Lang>(() => detectInitial());

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'ko';
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === 'ko' ? 'en' : 'ko');
  }, [lang, setLang]);

  return { lang, setLang, toggle };
}
