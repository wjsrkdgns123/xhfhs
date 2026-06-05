import type { Room, Phase } from '../../types';

export function StatusBadge({
  status,
  phase: _phase,
  extendRound: _extendRound,
}: {
  status: Room['status'];
  phase?: Phase;
  extendRound?: number;
}) {
  if (status === 'live') {
    return (
      <span className="status status-live">
        <span className="pulse-glow">●</span> LIVE
      </span>
    );
  }
  if (status === 'open') {
    return <span className="status status-open">모집중</span>;
  }
  return <span className="status status-end">종료</span>;
}
