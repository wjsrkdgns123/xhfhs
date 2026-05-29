import type { Lang } from '../i18n/landing';
import { lobbyStrings } from '../i18n/lobby';

interface LobbyMastheadProps {
  liveCount: number;
  /** Optional: open/ended counts to render as a small stat row above the title.
   *  When provided, replaces the legacy `.lb3-mast` block which sat below
   *  the masthead with the same info. */
  openCount?: number;
  endedCount?: number;
  /** Optional editorial date string (e.g. "2026. 5. 18. 화요일"). */
  dateLabel?: string;
  /** Optional sub-tagline (e.g. "하나의 주제, 두 사람의 입장. AI 사회자…"). */
  tagline?: React.ReactNode;
  onCreate?: () => void;
  onSpectate?: () => void;
  titleLine1?: string;
  titleLine2?: string;
  lang?: Lang;
}

/** Editorial dark masthead for the lobby header — newspaper banner style.
 *  Lifted from debate-battle-v2 design — top of LobbyView. */
export function LobbyMasthead({
  liveCount,
  openCount,
  endedCount,
  dateLabel,
  tagline,
  onCreate,
  onSpectate,
  titleLine1,
  titleLine2,
  lang = 'ko',
}: LobbyMastheadProps) {
  const t = lobbyStrings[lang].masthead;
  const line1 = titleLine1 ?? t.title1;
  const line2 = titleLine2 ?? t.title2;
  return (
    <section
      style={{
        background: 'var(--color-ink)',
        color: 'var(--color-paper-light)',
        padding: '36px 0 32px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1.5px solid var(--color-ink)',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div
          className="lobby-masthead-row"
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <span className="status status--live">
                <span className="status-dot" />
                {t.currentLive(liveCount)}
              </span>
              <span className="label-mono" style={{ color: 'var(--color-paper-darker)' }}>
                {t.tag}
              </span>
              {dateLabel && (
                <span className="label-mono" style={{ color: 'var(--color-ink-fade)' }}>
                  · {dateLabel}
                </span>
              )}
              {(openCount !== undefined || endedCount !== undefined) && (
                <span
                  className="label-mono"
                  style={{
                    marginLeft: 4,
                    paddingLeft: 12,
                    borderLeft: '1px solid var(--color-ink-soft)',
                    color: 'var(--color-paper-darker)',
                  }}
                >
                  {openCount !== undefined && <>{lang === 'en' ? 'Open' : '모집'} <b style={{ color: 'var(--color-gold)' }}>{openCount}</b></>}
                  {openCount !== undefined && endedCount !== undefined && <span style={{ margin: '0 6px', color: 'var(--color-ink-fade)' }}>·</span>}
                  {endedCount !== undefined && <>{lang === 'en' ? 'Ended' : '종료'} <b>{endedCount}</b></>}
                </span>
              )}
            </div>
            <h1
              className="display-2 serif-display"
              style={{
                color: 'var(--color-paper-light)',
                margin: 0,
                letterSpacing: '-0.035em',
                fontSize: 'clamp(28px, 5vw, 56px)',
              }}
            >
              {line1} <br />
              <span
                style={{ color: 'var(--color-vermillion)' }}
                className="brush-under brush-under--gold"
              >
                {line2}
              </span>
            </h1>
            {tagline && (
              <p
                className="kr-wrap"
                style={{
                  marginTop: 14,
                  marginBottom: 0,
                  color: 'var(--color-paper-darker)',
                  maxWidth: 560,
                  fontSize: 14,
                  lineHeight: 1.55,
                }}
              >
                {tagline}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {onCreate && (
              <button
                type="button"
                className="btn btn--shadow"
                style={{ background: 'var(--color-paper-light)' }}
                onClick={onCreate}
              >
                + {t.btnCreate}
              </button>
            )}
            {onSpectate && (
              <button
                type="button"
                className="btn btn--pri btn--shadow"
                onClick={onSpectate}
              >
                👁 {t.btnSpectate}
              </button>
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(var(--color-ink-soft) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink-soft) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      />
    </section>
  );
}
