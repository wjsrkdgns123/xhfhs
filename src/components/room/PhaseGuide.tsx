import { roomStrings } from '../../i18n/room';
import type { Phase, Side } from '../../types';
import type { Lang } from '../../i18n/landing';

export function PhaseGuide({ phase, side, lang }: { phase: Phase; side: Side; lang: Lang }) {
  const isRebuttal = phase === 'pro_rebut' || phase === 'con_rebut';
  const isPro = side === 'pro';
  const pg = roomStrings[lang].phaseGuide;
  const tips: readonly string[] = isRebuttal
    ? pg.rebuttal
    : isPro
      ? pg.proOpening
      : pg.conOpening;
  return (
    <div className="rm2-composer__guide">
      <div className="rm2-composer__guide-title">
        {roomStrings[lang].phases[phase]} {pg.titleSuffix}
      </div>
      <ul className="space-y-0.5 m-0 pl-0 list-none">
        {tips.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
