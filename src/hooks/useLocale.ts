import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Lang } from '../i18n/landing';
import { landingStrings } from '../i18n/landing';
import { commonStrings } from '../i18n/common';
import { headerStrings } from '../i18n/header';
import { lobbyStrings } from '../i18n/lobby';
import { roomStrings } from '../i18n/room';
import { verdictStrings } from '../i18n/verdict';
import { profileStrings } from '../i18n/profile';
import { learnStrings } from '../i18n/learn';
import { onboardingStrings } from '../i18n/onboarding';

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
 *
 * Also exposes a composite `t` object with strings for every i18n surface,
 * so callers can do `t.lobby.searchPlaceholder` etc. without per-component
 * imports.
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

  const t = useMemo(
    () => ({
      landing: landingStrings[lang],
      common: commonStrings[lang],
      header: headerStrings[lang],
      lobby: lobbyStrings[lang],
      room: roomStrings[lang],
      verdict: verdictStrings[lang],
      profile: profileStrings[lang],
      learn: learnStrings[lang],
      onboarding: onboardingStrings[lang], // #42: onboarding 도 t 컴포지트에 합류 (설계 일관성)
    }),
    [lang],
  );

  return { lang, setLang, toggle, t };
}
