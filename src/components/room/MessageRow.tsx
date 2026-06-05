import { AIModCard } from '../common';
import type { Message, Phase } from '../../types';

export function MessageRow({
  m,
  mine,
  phase,
  aiModVariant = 'scroll',
}: {
  m: Message;
  mine: boolean;
  phase?: Phase;
  aiModVariant?: 'scroll' | 'avatar' | 'minimal';
}) {
  if (m.side === 'moderator') {
    return (
      <div className="mx-auto max-w-[92%] msg--mod">
        <AIModCard variant={aiModVariant} message={m.text} phase={phase ?? 'opening'} />
      </div>
    );
  }
  const sideClass = m.side === 'pro' ? 'rm2-bubble--pro' : 'rm2-bubble--con';
  const chipClass = m.side === 'pro' ? 'rm2-bubble__chip--pro' : 'rm2-bubble__chip--con';
  const slideClass = m.side === 'pro' ? 'msg--pro' : m.side === 'con' ? 'msg--con' : '';
  const sideLabel = m.side === 'pro' ? 'PRO' : 'CON';
  return (
    <div className={`rm2-bubble ${sideClass} ${slideClass}`}>
      <div className="rm2-bubble__header">
        <span className={`rm2-bubble__chip ${chipClass}`}>{sideLabel}</span>
        <span className="rm2-bubble__name">{m.name}</span>
        {mine && <span className="rm2-bubble__mine">· 나</span>}
      </div>
      <p className="rm2-bubble__text">{m.text}</p>
    </div>
  );
}
