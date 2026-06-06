import type { CSSProperties } from 'react';
import { PHASE_LABEL, type Phase } from '../../types';
import './PhaseProgress.css';

type StepState = 'done' | 'active' | 'idle';
type StepSide = 'pro' | 'con' | 'neutral';

function sideOf(p: Phase): StepSide {
  if (p.startsWith('pro')) return 'pro';
  if (p.startsWith('con')) return 'con';
  return 'neutral'; // opening (and any future closing) = 공통
}

const SIDE_EYEBROW: Record<StepSide, string> = {
  pro: '찬성',
  con: '반대',
  neutral: '공통',
};

const STATE_TAG: Record<StepState, string> = {
  done: '완료',
  active: '현재',
  idle: '대기',
};

export function PhaseProgress({ phase }: { phase: Phase }) {
  const phases: Phase[] = ['opening', 'pro_arg', 'con_arg', 'pro_rebut', 'con_rebut'];
  const currentIdx = phases.indexOf(phase);

  return (
    <div className="phase-progress" role="group" aria-label="토론 단계 진행">
      <ol
        className="phase-progress__list"
        style={{ '--phase-count': phases.length } as CSSProperties}
      >
        {phases.map((p, i) => {
          const state: StepState = i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'idle';
          const side = sideOf(p);
          const label = PHASE_LABEL[p];
          return (
            <li
              key={p}
              className="phase-step"
              data-state={state}
              data-side={side}
              aria-current={state === 'active' ? 'step' : undefined}
              aria-label={`${STATE_TAG[state]} — ${label}`}
            >
              <span className="phase-step__mark" aria-hidden="true">
                {state === 'done' ? '✓' : i + 1}
              </span>
              <span className="phase-step__body">
                <span className="phase-step__eyebrow">{SIDE_EYEBROW[side]}</span>
                <span className="phase-step__label">{label}</span>
                <span className="phase-step__tag">{STATE_TAG[state]}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
