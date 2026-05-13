/**
 * Floating CTA that follows the viewport. Two variants:
 * - go-lobby (default): "토론하기" — used on landing/learn/content pages
 *   to send the user back into the lobby
 * - open-create: "방 만들기" — used inside the lobby to reveal the
 *   create-room form (via window.location.hash = '#create')
 */
export function FloatingLobbyBtn({
  variant = 'go-lobby',
  onClick,
}: {
  variant?: 'go-lobby' | 'open-create';
  onClick: () => void;
}) {
  const label = variant === 'open-create' ? '방 만들기' : '토론하기';
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
