import type { Phase } from '../../types';
import { PHASE_LABEL } from '../../types';

interface AIModCardProps {
  variant?: 'scroll' | 'avatar' | 'minimal';
  message?: string;
  thinking?: boolean;
  phase?: Phase | 'closing';
}

/** AI moderator card with three visual variants.
 *  - scroll: ribbon/scroll-style banner with gold left accent and gavel icon
 *  - avatar: standard chat-style with initial avatar + name + phase label
 *  - minimal: dashed dim card, mono "AI · 사회자" tag inline */
export function AIModCard({ variant = 'scroll', message, thinking = false, phase = 'opening' }: AIModCardProps) {
  const phaseLabel = phase === 'closing' ? '맺음말' : PHASE_LABEL[phase];

  if (variant === 'minimal') {
    return (
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '12px 16px',
          background: 'var(--color-paper)',
          border: '1px dashed var(--color-ink-fade)',
          borderRadius: 'var(--r-lg)',
          fontSize: 14,
          alignItems: 'flex-start',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 700,
            background: 'var(--color-ink)',
            color: 'var(--color-paper-light)',
            padding: '3px 7px',
            borderRadius: 'var(--r-pill)',
            letterSpacing: '0.1em',
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          AI · 사회자
        </span>
        <div style={{ flex: 1 }}>
          {thinking ? (
            <span style={{ color: 'var(--color-ink-fade)' }}>
              생각 중<span className="thinking-dot">.</span>
              <span className="thinking-dot">.</span>
              <span className="thinking-dot">.</span>
            </span>
          ) : (
            <span className="kr-wrap" style={{ color: 'var(--color-ink)' }}>
              {message}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div
        style={{
          display: 'flex',
          gap: 14,
          padding: 16,
          background: 'var(--color-gold-tint)',
          border: 'var(--border-line)',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-gold-tint)',
            color: 'var(--color-gold)',
            border: '1px solid var(--color-gold)',
            borderRadius: 'var(--r-pill)',
            fontFamily: 'var(--font-serif-display)',
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: '-0.02em',
            flexShrink: 0,
            boxShadow: 'var(--glow-gold)',
          }}
        >
          사
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-serif-display)', fontWeight: 800, fontSize: 14, color: 'var(--color-ink)' }}>
              사회자
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--color-gold)',
                letterSpacing: '0.1em',
              }}
            >
              AI · {phaseLabel}
            </span>
          </div>
          {thinking ? (
            <div style={{ color: 'var(--color-ink-fade)', fontSize: 14 }}>
              다음 단계를 정리 중입니다<span className="thinking-dot">.</span>
              <span className="thinking-dot">.</span>
              <span className="thinking-dot">.</span>
            </div>
          ) : (
            <div className="kr-wrap" style={{ color: 'var(--color-ink-soft)', fontSize: 14, lineHeight: 1.55 }}>
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        padding: '18px 20px 18px 64px',
        background: 'var(--color-paper-light)',
        border: 'var(--border-line)',
        borderLeft: '4px solid var(--color-gold)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 34,
          height: 34,
          background: 'var(--color-gold)',
          color: '#fff',
          border: 'var(--border-line)',
          borderRadius: 'var(--r-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 13L9 18l-3-3 5-5" />
          <path d="M16 16l3-3" />
          <path d="M9.6 4.6L13 8" />
          <path d="M3 21h12" />
          <path d="M17 7l4 4" />
          <path d="M13.5 3.5L20.5 10.5" />
        </svg>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span className="eyebrow eyebrow--gold">AI 사회자</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--color-ink-fade)',
            letterSpacing: '0.1em',
          }}
        >
          · {phaseLabel}
        </span>
      </div>
      {thinking ? (
        <div style={{ color: 'var(--color-ink-fade)', fontSize: 14, fontFamily: 'var(--font-hand)' }}>
          ...정리하는 중<span className="cursor-blink">_</span>
        </div>
      ) : (
        <div
          className="kr-wrap"
          style={{
            color: 'var(--color-ink)',
            fontSize: 15,
            lineHeight: 1.55,
            fontFamily: 'var(--font-serif-display)',
            fontWeight: 400,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
