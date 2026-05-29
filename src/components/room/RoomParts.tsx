// #25 (incremental step 5): presentational sub-components used only inside RoomView,
// extracted from App.tsx to shrink the god-component.
import { useState } from 'react';
import type { Lang } from '../../i18n/landing';
import { PHASE_LABEL, type Phase, type Room, type Side } from '../../types';
import { classNames } from '../../lib/cn';

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
                  border: '2px solid var(--color-ink)',
                  boxShadow: active ? '0 0 0 4px rgba(200, 75, 31, 0.3)' : undefined,
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

export function PhaseGuide({ phase, side }: { phase: Phase; side: Side }) {
  const isRebuttal = phase === 'pro_rebut' || phase === 'con_rebut';
  const isPro = side === 'pro';
  const tips: string[] = isRebuttal
    ? [
        '✗ 새 논거 도입 금지 — 입론에서 안 나온 논점은 꺼내지 마세요',
        '✓ 상대 발언을 직접 짚어 반박 (clash)',
        '✓ 자기 입장의 핵심을 다시 강조',
      ]
    : [
        isPro
          ? '✓ 입증책임은 찬성에 있습니다 — 명제를 적극 입증하세요'
          : '✓ 찬성 입증의 약점 짚기 또는 반대 측 자체 논거 제시',
        '✓ 핵심 논거 2-3개 + 각각 근거(자료·사례·논리)',
        '✓ 한 번의 메시지로 한 라운드를 끝내세요',
      ];
  return (
    <div
      className="px-3 py-2"
      style={{
        background: 'var(--color-paper)',
        border: '1.5px solid var(--color-ink-fade)',
        color: 'var(--color-ink-soft)',
        fontSize: 13,
        fontFamily: 'var(--font-serif)',
        lineHeight: 1.6,
      }}
    >
      <div
        className="font-bold mb-1"
        style={{
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-hand)',
          fontSize: 14,
        }}
      >
        {PHASE_LABEL[phase]} 가이드
      </div>
      <ul className="space-y-0.5 m-0 pl-0 list-none">
        {tips.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export function InviteLinkButton({ roomId, lang }: { roomId: string; lang: Lang }) {
  const [copied, setCopied] = useState<'link' | 'id' | null>(null);
  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=${roomId}`
      : '';

  const copy = async (what: 'link' | 'id') => {
    const text = what === 'link' ? url : roomId;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      window.prompt(lang === 'en' ? 'Copy this text:' : '복사할 텍스트:', text);
    }
  };

  const labels = lang === 'en'
    ? { private: '🔒 Private', link: '🔗 Invite link', linkCopied: '✓ Link copied', id: 'Copy ID', idCopied: '✓ ID copied' }
    : { private: '🔒 비공개방', link: '🔗 초대 링크', linkCopied: '✓ 링크 복사됨', id: 'ID 복사', idCopied: '✓ ID 복사됨' };

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs"
        style={{ color: 'var(--color-ink-fade)' }}
      >
        {labels.private}
      </span>
      <button
        onClick={() => copy('link')}
        className="btn"
        style={{ padding: '4px 10px', fontSize: 12 }}
      >
        {copied === 'link' ? labels.linkCopied : labels.link}
      </button>
      <button
        onClick={() => copy('id')}
        className="btn btn-ghost"
        style={{ padding: '4px 8px', fontSize: 12 }}
      >
        {copied === 'id' ? labels.idCopied : labels.id}
      </button>
    </div>
  );
}
