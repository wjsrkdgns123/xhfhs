import './RoundTimeline.css';

interface RoundTimelineProps {
  current: number;
  planned: number;
  lang?: 'ko' | 'en';
}

export function RoundTimeline({ current, planned, lang = 'ko' }: RoundTimelineProps) {
  if (planned <= 1) return null;
  const total = Math.max(1, Math.min(planned, 12));
  const safeCurrent = Math.min(Math.max(0, current), total - 1);

  return (
    <div
      className="round-timeline"
      role="group"
      aria-label={
        lang === 'en'
          ? `Round ${safeCurrent + 1} of ${total}`
          : `${total}라운드 중 ${safeCurrent + 1}라운드`
      }
    >
      <span className="round-timeline__heading">{lang === 'en' ? 'Rounds' : '라운드'}</span>
      <ol className="round-timeline__list">
        {Array.from({ length: total }, (_, i) => {
          const state = i < safeCurrent ? 'done' : i === safeCurrent ? 'active' : 'idle';
          return (
            <li
              key={i}
              className="round-timeline__item"
              data-state={state}
              aria-current={state === 'active' ? 'step' : undefined}
              aria-label={
                lang === 'en'
                  ? `Round ${i + 1}${state === 'active' ? ', current' : state === 'done' ? ', done' : ''}`
                  : `${i + 1}라운드${state === 'active' ? ', 현재' : state === 'done' ? ', 완료' : ''}`
              }
            >
              <span className="round-timeline__badge" aria-hidden="true">
                {state === 'done' ? '✓' : `R${i + 1}`}
              </span>
            </li>
          );
        })}
      </ol>
      <span className="round-timeline__count">
        {safeCurrent + 1}/{total}
      </span>
    </div>
  );
}
