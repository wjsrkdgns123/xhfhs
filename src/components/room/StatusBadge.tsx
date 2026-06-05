import type { Room, Phase } from '../../types';
import { roomStrings } from '../../i18n/room';
import type { Lang } from '../../i18n/landing';

export function StatusBadge({
  status,
  phase: _phase,
  extendRound: _extendRound,
  lang = 'ko',
}: {
  status: Room['status'];
  phase?: Phase;
  extendRound?: number;
  lang?: Lang;
}) {
  const t = roomStrings[lang].status;
  if (status === 'live') {
    return (
      <span className="status status-live">
        <span className="pulse-glow">●</span> LIVE
      </span>
    );
  }
  if (status === 'open') {
    return <span className="status status-open">{t.open}</span>;
  }
  return <span className="status status-end">{t.ended}</span>;
}
