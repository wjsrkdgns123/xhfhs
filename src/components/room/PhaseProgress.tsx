import { PHASE_LABEL, type Phase } from '../../types';
import { classNames } from '../../lib/ui';

export function PhaseProgress({ phase }: { phase: Phase }) {
  const phases: Phase[] = ['opening', 'pro_arg', 'con_arg', 'pro_rebut', 'con_rebut'];
  const currentIdx = phases.indexOf(phase);
  return (
    <div className="flex items-center gap-2 mb-4 px-2 py-2 overflow-x-auto">
      {phases.map((p, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={p} className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={classNames(
                  'rounded-full transition-all',
                  active && 'pulse-glow',
                )}
                style={{
                  width: active ? 16 : 12,
                  height: active ? 16 : 12,
                  background: done
                    ? 'var(--color-ink)'
                    : active
                      ? 'var(--color-vermillion)'
                      : 'var(--color-paper-light)',
                  border: '1.5px solid var(--color-line)',
                  boxShadow: active ? 'var(--glow-pro)' : undefined,
                }}
              />
              <span
                className="text-[10px] whitespace-nowrap font-bold"
                style={{
                  color: active
                    ? 'var(--color-vermillion)'
                    : done
                      ? 'var(--color-ink)'
                      : 'var(--color-ink-fade)',
                }}
              >
                {PHASE_LABEL[p]}
              </span>
            </div>
            {i < phases.length - 1 && (
              <div
                className="h-0.5 w-6"
                style={{
                  background: i < currentIdx ? 'var(--color-ink)' : 'var(--color-ink-fade)',
                  opacity: i < currentIdx ? 1 : 0.4,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
