// 토론배틀 로비 redesign — create-room modal with AI topic validation.
// Ported from the design bundle (redesign/토론배틀 토론장 로비.html › CreateModal);
// the merged "check-then-open" CTA runs a client-side heuristic, then performs the
// real Firebase create. Login-gated (calls onSignIn when signed out).
import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { CSSProperties } from 'react';
import type { Lang } from '../../../i18n/landing';
import type { Side } from '../../../types';

export interface CreateParams {
  topic: string;
  mode: 'human' | 'ai';
  side: Side;
  rounds: number;
  isPrivate: boolean;
}

type ValLevel = 'good' | 'soft' | 'block';
interface ValResult {
  ok: boolean;
  level: ValLevel;
  reason: string;
  suggest: string | null;
}

function reframeTopic(s: string, en: boolean): string {
  const t = s.trim().replace(/[.!?]+$/, '');
  if (en) return `Should we accept that ${t.charAt(0).toLowerCase() + t.slice(1)}?`;
  if (/다$/.test(t)) return t.replace(/다$/, '다는 주장은 타당한가?');
  if (/[가-힣]$/.test(t)) return t + '는 옳은가?';
  return t + ' — 찬성하는가?';
}

function validateTopic(raw: string, lang: Lang): ValResult {
  const en = lang === 'en';
  const s = (raw || '').trim();
  if (s.length < 6) return { ok: false, level: 'block', reason: en ? 'Too short — write it as one clear sentence.' : '주제가 너무 짧습니다. 한 문장으로 명확히 적어주세요.', suggest: null };
  if (/ㅋㅋ|ㅎㅎ|ㅗ|바보|멍청|시발|병신|개같|fuck|shit/i.test(s))
    return { ok: false, level: 'block', reason: en ? 'Contains language unsuitable for a debate topic.' : '토론 주제로 부적절한 표현이 포함되어 있습니다.', suggest: null };
  const koDebatable = /(인가|것인가|하는가|되어야|해야|마땅한가|필요한가|필요성|정당한가|옳은가|할까|폐지|도입|허용|금지|규제|확대|축소|강화|완화|하향|상향|의무화|찬반|찬성|반대|논란|옳고\s?그름)/.test(s);
  const enDebatable = /\b(should|must|ought|ban|abolish|legalize|allow|require|mandate|whether|is it|are we|right to|justified|necessary)\b/i.test(s);
  const debatable = koDebatable || enDebatable || /\?$/.test(s);
  if (!debatable)
    return {
      ok: false,
      level: 'soft',
      reason: en ? "Debatable enough — it'll be sharper if the two sides split cleanly." : '충분히 토론할 수 있는 주제예요. 다만 찬반이 또렷하게 갈리도록 다듬으면 더 명확해집니다.',
      suggest: reframeTopic(s, en),
    };
  return { ok: true, level: 'good', reason: en ? 'A clear pro/con motion — good to debate.' : '찬반이 명확히 나뉘는, 토론하기 좋은 주제입니다.', suggest: null };
}

export function CreateModal({
  lang,
  user,
  onClose,
  onSignIn,
  onCreate,
}: {
  lang: Lang;
  user: User | null;
  onClose: () => void;
  onSignIn: () => void;
  onCreate: (p: CreateParams) => Promise<void>;
}) {
  const en = lang === 'en';
  const [topic, setTopic] = useState('');
  const [side, setSide] = useState<Side>('pro');
  const [mode, setMode] = useState<'human' | 'ai'>('human');
  const [rounds, setRounds] = useState(2);
  const [priv, setPriv] = useState(false);
  const [creating, setCreating] = useState(false);
  const [check, setCheck] = useState<{ state: 'idle' | 'checking' | 'result'; result?: ValResult }>({ state: 'idle' });

  const result = check.state === 'result' ? check.result ?? null : null;
  const verified = !!result && result.ok;
  const softOk = !!result && result.level === 'soft';
  const checking = check.state === 'checking';

  const seg = (on: boolean): CSSProperties => ({
    flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'center',
    fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14.5, transition: 'all .14s ease',
    background: on ? 'var(--celadon)' : '#fff', color: on ? '#fff' : 'var(--ink-soft)', boxShadow: on ? 'none' : 'inset 0 0 0 1px #e3d9c2',
  });
  const sideSeg = (key: Side, color: string): CSSProperties => ({
    flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'center',
    fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14.5, transition: 'all .14s ease',
    background: side === key ? color : '#fff', color: side === key ? '#fff' : 'var(--ink-soft)', boxShadow: side === key ? 'none' : 'inset 0 0 0 1px #e3d9c2',
  });
  const label: CSSProperties = { fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', color: 'var(--ink-fade)', textTransform: 'uppercase', display: 'block', marginBottom: 10 };

  const runCreate = async () => {
    setCreating(true);
    try {
      await onCreate({ topic: topic.trim(), mode, side, rounds, isPrivate: priv });
      // success navigates to the room (unmounts the lobby); nothing else to do
    } catch {
      setCreating(false); // upstream surfaces a toast
    }
  };

  const verifyAndCreate = () => {
    if (!user) {
      onSignIn();
      return;
    }
    if (!topic.trim() || checking || creating) return;
    if (verified || softOk) {
      void runCreate();
      return;
    }
    setCheck({ state: 'checking' });
    window.setTimeout(() => {
      const r = validateTopic(topic, lang);
      setCheck({ state: 'result', result: r });
      if (r.level === 'good') window.setTimeout(() => void runCreate(), 700);
    }, 900);
  };
  const onTopicChange = (v: string) => {
    setTopic(v);
    if (check.state !== 'idle') setCheck({ state: 'idle' });
  };
  const applySuggest = () => {
    if (check.result?.suggest) setTopic(check.result.suggest);
    setCheck({ state: 'idle' });
  };
  const fillExample = () => {
    setTopic(en ? 'Will AI ultimately replace human jobs?' : '인공지능은 결국 인간의 일자리를 대체할 것인가?');
    setCheck({ state: 'idle' });
  };

  const ctaLabel = !user
    ? en ? 'Sign in with Google' : 'Google 로그인 후 토론방 열기'
    : creating || verified
      ? en ? 'Opening room…' : '검증 통과 · 토론방 여는 중…'
      : checking
        ? en ? 'AI moderator reviewing…' : 'AI 사회자가 검토 중…'
        : softOk
          ? en ? 'Open as-is →' : '이대로 토론방 열기 →'
          : en ? 'Check & open room →' : 'AI 검증 후 토론방 열기 →';
  const ctaActive = !user || !!topic.trim() || checking || verified || creating;
  const ctaDisabled = !!user && (!topic.trim() || checking || verified || creating);

  return (
    <div onClick={onClose} role="dialog" aria-modal="true" aria-label={en ? 'Create a room' : '토론방 만들기'} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(26,15,8,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="tb-root" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', background: '#fcf6e8', borderRadius: 24, padding: '34px 36px', boxShadow: '0 40px 80px -30px rgba(0,0,0,0.6)', animation: 'tb-fade .2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11.5, letterSpacing: '0.18em', color: 'var(--celadon)' }}>{en ? 'NEW DEBATE · SET THE MOTION' : '새 토론 · 주제 정하기'}</span>
            <h2 style={{ margin: '12px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 30, letterSpacing: '-0.025em', color: 'var(--ink)' }}>{en ? 'Create a room' : '토론방 만들기'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={en ? 'Close' : '닫기'} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#ece4d3', color: 'var(--ink-soft)', fontSize: 18, flexShrink: 0 }}>✕</button>
        </div>

        {/* topic + AI validation */}
        <div style={{ marginTop: 26 }}>
          <span style={label}>{en ? 'Debate topic' : '토론 주제'}</span>
          <textarea
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            rows={2}
            placeholder={en ? 'e.g. Will AI ultimately replace human jobs?' : '예: 인공지능은 결국 인간의 일자리를 대체할 것인가?'}
            style={{ width: '100%', boxSizing: 'border-box', resize: 'none', padding: '14px 16px', borderRadius: 14, border: 'none', boxShadow: verified ? 'inset 0 0 0 1.5px var(--celadon)' : 'inset 0 0 0 1.5px #e3d9c2', background: '#fff', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 17, lineHeight: 1.4, color: 'var(--ink)', outline: 'none' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={fillExample} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'var(--gold-tint)', color: 'var(--gold)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13 }}>
              {en ? 'Insert an example' : '예시 주제 넣기'}
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11, color: 'var(--ink-ghost)' }}>
              <span aria-hidden="true" style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, color: 'var(--celadon)' }}>討</span>
              {en ? 'The AI moderator reviews it when you open' : '토론방을 열 때 AI 사회자가 자동으로 검토합니다'}
            </span>
          </div>

          {checking && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '13px 16px', borderRadius: 14, background: '#fff', boxShadow: 'inset 0 0 0 1px #e3d9c2' }}>
              <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid #e3d9c2', borderTopColor: 'var(--celadon)', animation: 'tb-spin .7s linear infinite' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--ink-soft)' }}>{en ? 'The AI moderator is reviewing your topic…' : 'AI 사회자가 주제를 검토하는 중…'}</span>
            </div>
          )}
          {result && result.ok && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginTop: 14, padding: '14px 16px', borderRadius: 14, background: 'var(--celadon-tint)', boxShadow: 'inset 0 0 0 1px rgba(45,74,90,0.2)' }}>
              <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--celadon)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>✓</span>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14, color: 'var(--celadon)' }}>{en ? 'A debatable topic' : '토론 가능한 주제입니다'}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.45, wordBreak: 'keep-all' }}>{result.reason}</div>
              </div>
            </div>
          )}
          {result && result.level === 'soft' && (
            <div style={{ marginTop: 14, padding: '15px 16px', borderRadius: 14, background: 'var(--gold-tint)', boxShadow: 'inset 0 0 0 1px rgba(184,132,42,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--gold)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 15 }}>!</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14, color: 'var(--gold)' }}>{en ? 'A small tweak would sharpen it' : '이렇게 다듬으면 더 좋아요'}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.5, wordBreak: 'keep-all' }}>{result.reason}</div>
                  {result.suggest && (
                    <div style={{ marginTop: 12, padding: '11px 14px', borderRadius: 11, background: '#fff', boxShadow: 'inset 0 0 0 1px #e9deca' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-fade)', marginBottom: 6 }}>{en ? 'TRY THIS' : '이렇게 바꿔보면'}</div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 15.5, color: 'var(--ink)', lineHeight: 1.4, wordBreak: 'keep-all' }}>{result.suggest}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 11, flexWrap: 'wrap' }}>
                        <button type="button" onClick={applySuggest} style={{ padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'var(--celadon)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 12.5 }}>{en ? 'Use this topic' : '이 주제로 바꾸기'}</button>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11, color: 'var(--ink-ghost)' }}>{en ? "or open as-is below" : "또는 아래 ‘이대로 토론방 열기’"}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {result && result.level === 'block' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginTop: 14, padding: '14px 16px', borderRadius: 14, background: '#fcebe2', boxShadow: 'inset 0 0 0 1px rgba(200,75,31,0.3)' }}>
              <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--vermillion)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>✕</span>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14, color: 'var(--vermillion)' }}>{en ? "Can't open a room with this topic" : '이 주제로는 토론방을 열 수 없어요'}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.5, wordBreak: 'keep-all' }}>{result.reason}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 24 }}>
          <div>
            <span style={label}>{en ? 'Opponent' : '상대'}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setMode('human')} style={seg(mode === 'human')}>{en ? 'Human' : '사람'}</button>
              <button type="button" onClick={() => setMode('ai')} style={seg(mode === 'ai')}>討 AI</button>
            </div>
          </div>
          <div>
            <span style={label}>{en ? 'My side' : '내 입장'}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setSide('pro')} style={sideSeg('pro', 'var(--vermillion)')}>{en ? 'Pro' : '찬성'}</button>
              <button type="button" onClick={() => setSide('con')} style={sideSeg('con', 'var(--celadon)')}>{en ? 'Con' : '반대'}</button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <span style={label}>{en ? 'Rounds' : '라운드'}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3].map((n) => (
              <button type="button" key={n} onClick={() => setRounds(n)} style={seg(rounds === n)}>{en ? `${n} rounds` : `${n}라운드`}</button>
            ))}
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 22, cursor: 'pointer' }}>
          <button type="button" role="switch" aria-checked={priv} onClick={() => setPriv(!priv)} aria-label={en ? 'Private room' : '비공개 방'} style={{ width: 44, height: 26, padding: 0, border: 'none', borderRadius: 999, cursor: 'pointer', background: priv ? 'var(--celadon)' : '#d9cdb4', position: 'relative', transition: 'background .16s ease', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 3, left: priv ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .16s ease', boxShadow: '0 2px 5px rgba(0,0,0,0.25)' }} />
          </button>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink-soft)' }}>{en ? 'Private room (invite link only)' : '비공개 방 (초대 링크로만 입장)'}</span>
        </label>

        <button
          type="button"
          onClick={verifyAndCreate}
          disabled={ctaDisabled}
          style={{ width: '100%', marginTop: 26, padding: '16px 0', borderRadius: 14, border: 'none', cursor: ctaDisabled ? 'default' : 'pointer', background: ctaActive ? 'var(--celadon)' : '#e3d9c2', color: ctaActive ? '#fff' : 'var(--ink-ghost)', boxShadow: ctaActive ? '0 16px 32px -14px var(--celadon)' : 'none', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 16, transition: 'all .16s ease', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          {(checking || creating) && <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.45)', borderTopColor: '#fff', animation: 'tb-spin .7s linear infinite' }} />}
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
