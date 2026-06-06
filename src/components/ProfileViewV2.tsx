import { useState } from 'react';
import type { Side, UserProfile } from '../types';

interface HistoryEntry {
  topic: string;
  side: Side;
  result: 'win' | 'lose' | 'tie';
  score: string;
  date: string;
  voice?: string;
}

interface RankEntry {
  rank: number;
  name: string;
  delta: string;
  wins: number;
  rate: number;
  mine?: boolean;
}

interface Badge {
  name: string;
  desc: string;
  color: 'gold' | 'vermillion' | 'celadon' | 'ink';
  earned: boolean;
}

interface SkillScores {
  logic?: number;
  evidence?: number;
  rebuttal?: number;
  persuasion?: number;
}

interface ProfileViewV2Props {
  profile: UserProfile;
  daysSinceJoin?: number;
  voice?: string;
  history?: HistoryEntry[];
  badges?: Badge[];
  ranking?: RankEntry[];
  skills?: SkillScores;
  improvementNote?: string;
  winStreak?: number;
  last7?: ('win' | 'lose' | 'tie')[];
  totalDebates?: number;
}

/** Profile + leaderboard view with three tabs: 내 기록 / 뱃지 / 리그 순위.
 *  Lifted from debate-battle-v2 design — ProfileView in screen-rest.jsx.
 *  All data is passed in via props so the parent can hook to Firestore. */
export function ProfileViewV2({
  profile,
  daysSinceJoin = 0,
  voice = '본질을 짚는 사람',
  history = [],
  badges = [],
  ranking = [],
  skills = {},
  improvementNote,
  winStreak = 0,
  last7 = [],
  totalDebates,
}: ProfileViewV2Props) {
  const [tab, setTab] = useState<'me' | 'badges' | 'rank'>('me');

  const totalWins =
    (profile.winsVsHuman ?? 0) + (profile.winsVsAi ?? 0);
  const totalLosses =
    (profile.lossesVsHuman ?? 0) + (profile.lossesVsAi ?? 0);
  const totalGames = totalDebates ?? profile.totalDebates ?? totalWins + totalLosses;
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  return (
    <div className="float-in">
      <section
        style={{
          background: 'var(--color-paper-deep)',
          padding: '48px 0',
          borderBottom: '1px solid var(--color-line)',
        }}
      >
        <div
          className="profile-header"
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: 36,
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative' }}>
            <span
              style={{
                width: 120,
                height: 120,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-paper-light)',
                color: 'var(--color-ink)',
                border: '2px solid var(--color-ink)',
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
                fontFamily: 'var(--font-serif-display)',
                fontWeight: 800,
                fontSize: 54,
                letterSpacing: '-0.02em',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {profile.nickname.charAt(0) || '?'}
            </span>
            {winStreak >= 3 && (
              <div style={{ position: 'absolute', bottom: -6, right: -6, transform: 'rotate(8deg)' }}>
                <span className="stamp stamp--gold">연승 {winStreak}</span>
              </div>
            )}
          </div>
          <div>
            <div className="eyebrow eyebrow--vermillion">
              표시명 · {profile.nickname}
              {daysSinceJoin > 0 ? ` · 가입 ${daysSinceJoin}일째` : ''}
            </div>
            <h1
              className="display-2 serif-display"
              style={{ marginTop: 8, marginBottom: 4, letterSpacing: '-0.035em' }}
            >
              {voice}
            </h1>
            <p style={{ margin: 0, color: 'var(--color-ink-soft)', fontSize: 15 }}>
              <span>
                vs 사람{' '}
                <strong style={{ fontWeight: 700, color: 'var(--color-ink)' }}>
                  {profile.winsVsHuman ?? 0}승 {profile.lossesVsHuman ?? 0}패
                </strong>
              </span>
              <span style={{ color: 'var(--color-ink-fade)', margin: '0 8px' }}>·</span>
              <span>
                vs AI{' '}
                <strong style={{ fontWeight: 700, color: 'var(--color-ink)' }}>
                  {profile.winsVsAi ?? 0}승 {profile.lossesVsAi ?? 0}패
                </strong>
              </span>
              {winStreak >= 2 && (
                <>
                  <span style={{ color: 'var(--color-ink-fade)', margin: '0 8px' }}>·</span>
                  <span>최장 연승 {winStreak}</span>
                </>
              )}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="label-mono" style={{ color: 'var(--color-ink-fade)' }}>
              승률
            </div>
            <div
              className="serif-display"
              style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em' }}
            >
              {winRate}
              <span style={{ fontSize: 24, color: 'var(--color-ink-fade)' }}>%</span>
            </div>
            <div className="label-mono" style={{ color: 'var(--color-gold-dim)' }}>
              총 {totalGames}전
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div
          style={{
            display: 'flex',
            gap: 4,
            borderBottom: '1px solid var(--color-line)',
            marginBottom: 28,
          }}
        >
          {(
            [
              { id: 'me', label: '내 기록' },
              { id: 'badges', label: '뱃지' },
              { id: 'rank', label: '리그 순위' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              style={{
                minHeight: 44,
                padding: '11px 20px',
                background: tab === t.id ? 'var(--color-ink)' : 'transparent',
                color: tab === t.id ? 'var(--color-paper-light)' : 'var(--color-ink-soft)',
                fontFamily: 'var(--font-serif-display)',
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: '-0.02em',
                border: 'none',
                borderRadius: 'var(--r-md)',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'me' && (
          <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
            <div>
              <div className="eyebrow">
                최근 토론 · {history.length}건<span className="eyebrow__after" />
              </div>
              {history.length === 0 ? (
                <div
                  style={{
                    marginTop: 14,
                    padding: 28,
                    textAlign: 'center',
                    background: 'var(--color-paper-light)',
                    border: '1px solid var(--color-line)',
                    borderRadius: 'var(--r-lg)',
                    color: 'var(--color-ink-fade)',
                    fontFamily: 'var(--font-hand)',
                    fontSize: 17,
                  }}
                >
                  아직 마친 토론이 없다. 첫 한 판을 시작해 보자.
                </div>
              ) : (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 'var(--gap-stack)' }}>
                  {history.map((h, i) => (
                    <HistoryRow key={i} entry={h} />
                  ))}
                </div>
              )}
            </div>

            <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-stack)' }}>
              {winStreak > 0 && (
                <div
                  style={{
                    padding: 20,
                    background: 'var(--color-paper-light)',
                    color: 'var(--color-ink)',
                    border: '1px solid var(--color-line)',
                    borderRadius: 'var(--r-lg)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div className="eyebrow eyebrow--gold">현재 시즌</div>
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span
                      className="serif-display"
                      style={{
                        fontSize: 42,
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        color: 'var(--color-ink)',
                      }}
                    >
                      {winStreak}
                    </span>
                    <span style={{ color: 'var(--color-ink-fade)' }}>연승 중</span>
                  </div>
                  {last7.length > 0 && (
                    <>
                      <div
                        className="label-mono"
                        style={{ color: 'var(--color-ink-fade)', marginTop: 16, marginBottom: 8 }}
                      >
                        최근 {last7.length}전
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {last7.map((r, i) => (
                          <span
                            key={i}
                            title={r === 'win' ? '승' : r === 'lose' ? '패' : '무'}
                            style={{
                              width: 24,
                              height: 24,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 'var(--r-sm)',
                              fontFamily: 'var(--font-serif-display)',
                              fontWeight: 800,
                              fontSize: 13,
                              background:
                                r === 'win'
                                  ? 'var(--color-ink)'
                                  : 'transparent',
                              color:
                                r === 'win'
                                  ? 'var(--color-paper-light)'
                                  : r === 'lose'
                                  ? 'var(--color-ink-soft)'
                                  : 'var(--color-ink-fade)',
                              border:
                                r === 'win'
                                  ? '1px solid var(--color-ink)'
                                  : '1px solid var(--color-line)',
                            }}
                          >
                            {r === 'win' ? '승' : r === 'lose' ? '패' : '무'}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {(skills.logic !== undefined ||
                skills.evidence !== undefined ||
                skills.rebuttal !== undefined ||
                skills.persuasion !== undefined) && (
                <div
                  style={{
                    padding: 20,
                    background: 'var(--color-paper-light)',
                    border: '1px solid var(--color-line)',
                    borderRadius: 'var(--r-lg)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div className="eyebrow">강점 분석</div>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {skills.logic !== undefined && <SkillRow label="논리 정합성" val={skills.logic} />}
                    {skills.evidence !== undefined && <SkillRow label="근거 강도" val={skills.evidence} />}
                    {skills.rebuttal !== undefined && <SkillRow label="반박 속도" val={skills.rebuttal} />}
                    {skills.persuasion !== undefined && <SkillRow label="설득력" val={skills.persuasion} />}
                  </div>
                </div>
              )}

              {improvementNote && (
                <div
                  style={{
                    padding: 20,
                    background: 'var(--color-paper-light)',
                    border: '1px solid var(--color-line)',
                    borderRadius: 'var(--r-lg)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div className="eyebrow">개선 포인트</div>
                  <p
                    className="kr-wrap"
                    style={{
                      margin: '8px 0 0',
                      fontSize: 13.5,
                      lineHeight: 1.65,
                      color: 'var(--color-ink-soft)',
                      fontFamily: 'var(--font-serif-display)',
                    }}
                  >
                    {improvementNote}
                  </p>
                </div>
              )}
            </aside>
          </div>
        )}

        {tab === 'badges' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--gap-stack)' }}>
            {badges.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  padding: 28,
                  textAlign: 'center',
                  background: 'var(--color-paper-light)',
                  border: '1px solid var(--color-line)',
                  borderRadius: 'var(--r-lg)',
                  color: 'var(--color-ink-fade)',
                  fontFamily: 'var(--font-hand)',
                  fontSize: 17,
                }}
              >
                획득한 뱃지가 아직 없다.
              </div>
            ) : (
              badges.map((b) => <BadgeCard key={b.name} badge={b} />)
            )}
          </div>
        )}

        {tab === 'rank' && (
          <div>
            <div className="eyebrow">
              이번 주 리그 · 상위 {ranking.length}명<span className="eyebrow__after" />
            </div>
            {ranking.length === 0 ? (
              <div
                style={{
                  marginTop: 14,
                  padding: 28,
                  textAlign: 'center',
                  background: 'var(--color-paper-light)',
                  border: '1px solid var(--color-line)',
                  borderRadius: 'var(--r-lg)',
                  color: 'var(--color-ink-fade)',
                  fontFamily: 'var(--font-hand)',
                  fontSize: 17,
                }}
              >
                아직 순위 데이터가 없다.
              </div>
            ) : (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 'var(--gap-stack)' }}>
                {ranking.map((p) => (
                  <RankRow key={p.rank} entry={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 880px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 720px) {
          .profile-header { grid-template-columns: 1fr !important; text-align: center; justify-items: center; }
        }
      `}</style>
    </div>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const sideColor = entry.side === 'pro' ? 'var(--color-vermillion)' : 'var(--color-celadon)';
  return (
    <div
      style={{
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: '80px 1fr auto auto',
        gap: 16,
        alignItems: 'center',
        background: 'var(--color-paper-light)',
        border: '1px solid var(--color-line)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            padding: '3px 9px',
            background: sideColor,
            color: 'var(--color-paper-light)',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.06em',
            borderRadius: 'var(--r-sm)',
          }}
        >
          {entry.side === 'pro' ? '찬' : '반'}
        </span>
        <span className="label-mono">{entry.date}</span>
      </div>
      <div
        className="serif-display kr-wrap"
        style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}
      >
        「{entry.topic}」
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'var(--color-ink-fade)',
        }}
      >
        {entry.score}
      </span>
      <span
        className={`status status--${
          entry.result === 'win' ? 'live' : entry.result === 'tie' ? 'open' : 'ended'
        }`}
      >
        {entry.result === 'win' ? '승' : entry.result === 'tie' ? '무' : '패'}
      </span>
    </div>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const c =
    badge.color === 'vermillion'
      ? 'var(--color-vermillion)'
      : badge.color === 'celadon'
      ? 'var(--color-celadon)'
      : badge.color === 'gold'
      ? 'var(--color-gold)'
      : 'var(--color-ink)';
  return (
    <div
      style={{
        padding: 20,
        background: badge.earned ? 'var(--color-paper-light)' : 'transparent',
        border: '1px solid var(--color-line)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        boxShadow: badge.earned ? 'var(--shadow-sm)' : 'none',
        opacity: badge.earned ? 1 : 0.5,
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          background: badge.earned ? c : 'transparent',
          color: badge.earned ? 'var(--color-paper-light)' : 'var(--color-ink-fade)',
          border: `2px solid ${badge.earned ? c : 'var(--color-line)'}`,
          borderRadius: 'var(--r-md)',
          margin: '0 auto 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-serif-display)',
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: '-0.03em',
        }}
      >
        {badge.name.charAt(0)}
      </div>
      <div className="serif-display" style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
        {badge.name}
      </div>
      <div className="kr-wrap" style={{ marginTop: 4, fontSize: 12, color: 'var(--color-ink-soft)' }}>
        {badge.desc}
      </div>
    </div>
  );
}

function RankRow({ entry }: { entry: RankEntry }) {
  const topColor =
    entry.rank === 1
      ? 'var(--color-gold)'
      : entry.rank === 2
      ? 'var(--color-ink-soft)'
      : entry.rank === 3
      ? 'var(--color-ink-fade)'
      : 'var(--color-ink)';
  return (
    <div
      style={{
        position: 'relative',
        padding: '14px 20px',
        display: 'grid',
        gridTemplateColumns: '60px 32px 1fr 100px 60px',
        gap: 16,
        alignItems: 'center',
        background: entry.mine ? 'var(--color-gold-tint)' : 'var(--color-paper-light)',
        border: entry.mine
          ? '2px solid var(--color-gold)'
          : '1px solid var(--color-line)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {entry.rank <= 3 && (
        <span
          aria-hidden="true"
          className="serif-display"
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1,
            color: topColor,
            opacity: 0.08,
            letterSpacing: '-0.05em',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {entry.rank}
        </span>
      )}
      <span
        className="serif-display"
        style={{
          position: 'relative',
          fontSize: entry.rank <= 3 ? 28 : 22,
          fontWeight: 800,
          color: topColor,
          letterSpacing: '-0.03em',
        }}
      >
        #{entry.rank}
      </span>
      <span
        style={{
          width: 32,
          height: 32,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: entry.mine ? 'var(--color-gold-tint)' : 'var(--color-paper-deep)',
          color: entry.mine ? 'var(--color-gold-dim)' : 'var(--color-ink)',
          border: `1.5px solid ${entry.mine ? 'var(--color-gold)' : 'var(--color-line)'}`,
          borderRadius: 'var(--r-sm)',
          fontFamily: 'var(--font-serif-display)',
          fontWeight: 800,
          fontSize: 14,
        }}
      >
        {entry.name.charAt(0)}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-serif-display)',
          fontWeight: entry.mine ? 800 : 700,
          fontSize: 15,
          letterSpacing: '-0.02em',
        }}
      >
        {entry.name}
        {entry.mine && (
          <span style={{ color: 'var(--color-gold-dim)', fontSize: 12, marginLeft: 6 }}>(나)</span>
        )}
      </span>
      <span
        style={{
          position: 'relative',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--color-ink-fade)',
          letterSpacing: '0.06em',
        }}
      >
        {entry.wins}승 · {entry.rate}%
      </span>
      <span
        style={{
          position: 'relative',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          fontWeight: 700,
          color: entry.delta.startsWith('+')
            ? 'var(--color-gold-dim)'
            : entry.delta.startsWith('-')
            ? 'var(--color-ink-soft)'
            : 'var(--color-ink-fade)',
          textAlign: 'right',
        }}
      >
        {entry.delta}
      </span>
    </div>
  );
}

function SkillRow({ label, val }: { label: string; val: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ fontFamily: 'var(--font-serif-display)', fontWeight: 700 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink)' }}>{val}</span>
      </div>
      <div
        style={{
          height: 8,
          background: 'var(--color-paper-deep)',
          border: '1px solid var(--color-line)',
          borderRadius: 'var(--r-pill)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, val))}%`,
            background: 'var(--color-ink)',
            borderRadius: 'var(--r-pill)',
            transition: 'width 0.6s',
          }}
        />
      </div>
    </div>
  );
}
