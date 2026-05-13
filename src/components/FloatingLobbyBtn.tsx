/**
 * Floating "토론장으로" CTA that follows the viewport.
 * Shown on landing/learn/content/legal pages — anywhere except inside
 * the lobby/room/profile views (the user is already there).
 */
export function FloatingLobbyBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="float-lobby-btn"
      aria-label="토론장으로 이동"
    >
      <span className="float-lobby-btn__icon" aria-hidden="true">⚔</span>
      <span className="float-lobby-btn__label">토론장으로</span>
      <span className="float-lobby-btn__arrow" aria-hidden="true">→</span>
    </button>
  );
}
