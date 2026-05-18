import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dusk' | 'dawn' | 'dark';

const STORAGE_KEY = 'debateBattle:theme';
const CYCLE: Theme[] = ['light', 'dusk', 'dawn', 'dark'];

function isTheme(v: string | null): v is Theme {
  return v === 'light' || v === 'dusk' || v === 'dawn' || v === 'dark';
}

/** Initial theme: stored preference > OS preference > 'light'. */
function detectInitial(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isTheme(stored)) return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Single-source theme state for the app — 4-theme cycle (v2 design package):
 *   light → dusk → dawn → dark → light
 * - dusk + dawn are warmer/cooler paper variants between light and ink.
 * - User pick is written to localStorage and to <html data-theme>.
 * - CSS uses `[data-theme="X"]` for each variant; legacy media query handles
 *   OS dark preference when user hasn't picked.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => detectInitial());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    const idx = CYCLE.indexOf(theme);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setTheme(next);
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}
