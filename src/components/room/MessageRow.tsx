import { AIModCard } from '../common';
import type { Message, Phase } from '../../types';
import type { Lang } from '../../i18n/landing';

export function MessageRow({
  m,
  mine,
  phase,
  aiModVariant = 'scroll',
  lang = 'ko',
}: {
  m: Message;
  mine: boolean;
  phase?: Phase;
  aiModVariant?: 'scroll' | 'avatar' | 'minimal';
  lang?: Lang;
}) {
  if (m.side === 'moderator') {
    return (
      <div className="mx-auto max-w-[92%] msg--mod">
        <AIModCard variant={aiModVariant} message={m.text} phase={phase ?? 'opening'} />
      </div>
    );
  }
  const isPro = m.side === 'pro';
  const sideClass = isPro ? 'rm2-bubble--pro' : 'rm2-bubble--con';
  const chipClass = isPro ? 'rm2-bubble__chip--pro' : 'rm2-bubble__chip--con';
  const slideClass = m.side === 'pro' ? 'msg--pro' : m.side === 'con' ? 'msg--con' : '';
  // 찬/반 = 색 + 라벨 + 위치. 색만으로 의미를 전달하지 않도록 한국어 라벨을 병기한다.
  const sideLabel = lang === 'en' ? (isPro ? 'Pro' : 'Con') : isPro ? '찬성' : '반대';
  const mineLabel = lang === 'en' ? ' · me' : ' · 나';
  const speechAria =
    lang === 'en'
      ? `${sideLabel} side statement by ${m.name}${mine ? ' (me)' : ''}`
      : `${sideLabel} 측 ${m.name}${mine ? ' (나)' : ''} 발언`;
  return (
    <article className={`rm2-bubble ${sideClass} ${slideClass}`} aria-label={speechAria}>
      <div className="rm2-bubble__header">
        {/* 진영 정보는 부모 article의 aria-label이 이미 전달하므로 칩은 시각 전용 */}
        <span className={`rm2-bubble__chip ${chipClass}`} aria-hidden="true">
          {sideLabel}
        </span>
        <span className="rm2-bubble__name">{m.name}</span>
        {mine && (
          <span className="rm2-bubble__mine" aria-label={lang === 'en' ? 'my message' : '내 발언'}>
            {mineLabel}
          </span>
        )}
      </div>
      <p className="rm2-bubble__text">{m.text}</p>
    </article>
  );
}
