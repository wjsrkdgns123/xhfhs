import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'debateBattle:theme';

/** Initial theme: stored preference > OS preference > 'light'. */
function detectInitial(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Single-source theme state for the app.
 * - Default initial = OS preference (or stored override if user has picked).
 * - User pick is written to localStorage and to <html data-theme>.
 * - CSS uses both `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)
 *   :root:not([data-theme="light"])` so the OS theme still works when the user
 *   hasn't expressed a preference.
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
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}
