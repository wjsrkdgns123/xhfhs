import { Nameplate, ProfileAvatar } from '../common';
import type { AvatarId } from '../common';
import { roomStrings } from '../../i18n/room';
import { AI_OPPONENT_UID } from '../../types';
import type { Lang } from '../../i18n/landing';

export function SideCard({
  variant,
  name,
  mine,
  speaking,
  empty,
  canTake,
  onTake,
  avatarId,
  avatarDataUrl,
  isAi,
  lang,
}: {
  variant: 'pro' | 'con';
  name: string | null;
  mine: boolean;
  speaking: boolean;
  empty: boolean;
  canTake: boolean;
  onTake: () => void;
  avatarId?: string | null;
  avatarDataUrl?: string | null;
  isAi?: boolean;
  lang: Lang;
}) {
  const accent =
    variant === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)';
  const tk = roomStrings[lang].take;
  const sideWord =
    variant === 'pro' ? (lang === 'en' ? 'Pro' : '찬성') : lang === 'en' ? 'Con' : '반대';
  const seatLabel = variant === 'pro' ? tk.proLabel : tk.conLabel;
  const joinLabel = variant === 'pro' ? tk.pro : tk.con;

  if (empty) {
    return (
      <div className={`rm2-emptyseat rm2-emptyseat--${variant}`}>
        <div className={`rm2-emptyseat__chip rm2-emptyseat__chip--${variant}`}>?</div>
        <Nameplate variant={variant} size="sm">
          {seatLabel}
        </Nameplate>
        {canTake && (
          <button
            type="button"
            onClick={onTake}
            className={`rm2-take-btn rm2-take-btn--${variant}`}
          >
            {joinLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rm2-sidecard rm2-sidecard--${variant}${
        speaking ? ` rm2-sidecard--speaking-${variant}` : ''
      }`}
    >
      <Nameplate variant={variant} size="sm">
        {sideWord}
        {speaking && ' 🎤'}
      </Nameplate>
      <span
        className={`rm2-sidecard__avatar-wrap--${variant}`}
        style={{ display: 'inline-flex', overflow: 'hidden', margin: '10px 0 2px' }}
      >
        <ProfileAvatar
          avatarId={avatarId as AvatarId | undefined}
          avatarDataUrl={avatarDataUrl}
          size={76}
          style={{ filter: !speaking ? 'saturate(0.9)' : undefined }}
        />
      </span>
      <p className="rm2-sidecard__name">
        {speaking ? (
          <span className="brush-under" style={{ color: accent }}>
            {name ?? tk.empty}
          </span>
        ) : (
          name ?? tk.empty
        )}
      </p>
      {isAi && <span className="rm2-sidecard__ai-label">{tk.ai}</span>}
      {mine && <span className="rm2-sidecard__mine-badge">{lang === 'en' ? '(you)' : '(나)'}</span>}
    </div>
  );
}

// Re-export AI_OPPONENT_UID so callers don't need to import separately
export { AI_OPPONENT_UID };
