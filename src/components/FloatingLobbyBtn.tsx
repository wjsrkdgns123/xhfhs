import type { Lang } from '../i18n/landing';
import { headerStrings } from '../i18n/header';

/**
 * Floating CTA that follows the viewport. Two variants:
 * - go-lobby (default): "토론하기" / "Debate now" — used on landing/learn/content
 *   pages to send the user back into the lobby
 * - open-create: "방 만들기" / "Create room" — used inside the lobby to reveal
 *   the create-room form (via window.location.hash = '#create')
 */
export function FloatingLobbyBtn({
  variant = 'go-lobby',
  onClick,
  lang = 'ko',
}: {
  variant?: 'go-lobby' | 'open-create';
  onClick: () => void;
  lang?: Lang;
}) {
  const t = headerStrings[lang].floating;
  const label = variant === 'open-create' ? t.openCreate : t.goLobby;
  const icon = variant === 'open-create' ? '+' : '⚔';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`float-lobby-btn float-lobby-btn--${variant}`}
      aria-label={label}
    >
      <span className="float-lobby-btn__icon" aria-hidden="true">{icon}</span>
      <span className="float-lobby-btn__label">{label}</span>
      <span className="float-lobby-btn__arrow" aria-hidden="true">→</span>
    </button>
  );
}
