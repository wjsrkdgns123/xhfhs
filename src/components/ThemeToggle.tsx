import type { Theme } from '../hooks/useTheme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

const NEXT_LABEL: Record<Theme, string> = {
  light: '저녁(dusk)으로 / Switch to dusk',
  dusk: '새벽(dawn)으로 / Switch to dawn',
  dawn: '먹(dark)으로 / Switch to dark',
  dark: '낮(light)으로 / Switch to light',
};

/**
 * 4-theme cycle button: light → dusk → dawn → dark.
 * Shows the *current* theme's icon (so users see where they are), title
 * announces the *next* state.
 */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const label = NEXT_LABEL[theme];
  return (
    <button
      type="button"
      onClick={onToggle}
      className="theme-toggle"
      aria-label={label}
      title={label}
      data-current-theme={theme}
    >
      {theme === 'light' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2 V4 M12 20 V22 M4.93 4.93 L6.34 6.34 M17.66 17.66 L19.07 19.07 M2 12 H4 M20 12 H22 M4.93 19.07 L6.34 17.66 M17.66 6.34 L19.07 4.93"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )}
      {theme === 'dusk' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {/* Half-sun on horizon — afternoon */}
          <path d="M3 18 H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M7 18 A5 5 0 0 1 17 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <path
            d="M12 6 V8 M5.5 9.5 L6.9 10.9 M18.5 9.5 L17.1 10.9 M3 14 H4.5 M19.5 14 H21"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )}
      {theme === 'dawn' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {/* Sun rising with rays — morning */}
          <path d="M3 20 H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.15" />
          <path
            d="M12 4 V6 M5.2 7.2 L6.6 8.6 M18.8 7.2 L17.4 8.6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )}
      {theme === 'dark' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20.5 14.5 A8 8 0 1 1 9.5 3.5 A6.5 6.5 0 0 0 20.5 14.5 Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}
