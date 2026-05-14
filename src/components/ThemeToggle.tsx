import type { Theme } from '../hooks/useTheme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

/**
 * Small icon button — sun for light, moon for dark. Clicking toggles to the
 * opposite explicit theme; the icon shown is the *current* theme (so users
 * see what they're in, not what they'll switch to).
 */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const label =
    theme === 'light' ? '다크 모드로 전환 / Switch to dark' : '라이트 모드로 전환 / Switch to light';
  return (
    <button
      type="button"
      onClick={onToggle}
      className="theme-toggle"
      aria-label={label}
      title={label}
    >
      {theme === 'light' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {/* Sun */}
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2 V4 M12 20 V22 M4.93 4.93 L6.34 6.34 M17.66 17.66 L19.07 19.07 M2 12 H4 M20 12 H22 M4.93 19.07 L6.34 17.66 M17.66 6.34 L19.07 4.93"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {/* Moon */}
          <path
            d="M20.5 14.5 A8 8 0 1 1 9.5 3.5 A6.5 6.5 0 0 0 20.5 14.5 Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}
