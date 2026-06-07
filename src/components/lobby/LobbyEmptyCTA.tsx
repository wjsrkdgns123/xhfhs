import type { Lang } from '../../i18n/landing';

/** v2 empty-state — "비어있지만 의도된 신문 1면 빈 무대" 톤.
 *  위계: eyebrow(라벨) → serif 제목 → 잉크 밑줄 → 본문(body) + 짧은 손글씨 악센트 1구절 → 자기완결 CTA.
 *  손글씨(hand)는 톤만 살리는 한 구절로 절제(정본: hand 소량). 본문은 var(--font-body)/ink-soft.
 *  큰 한자(開) 워터마크는 카드 안쪽으로(overflow:hidden + inset) 은은하게.
 *  카드 안에 직접 "토론방 만들기" 단일 vermillion CTA를 두어 외부 버튼을 가리키지 않고 자기완결. */
export function LobbyEmptyCTA({ lang, onCreate }: { lang: Lang; onCreate?: () => void }) {
  const en = lang === 'en';
  return (
    <div className="lb2-empty-stage" role="region" aria-label={en ? 'Empty lobby' : '빈 토론장'}>
      <span aria-hidden="true" className="lb2-empty-stage__glyph">開</span>

      <div className="lb2-empty-stage__body">
        <div className="lb2-empty-stage__eyebrow">
          <span aria-hidden="true" className="lb2-empty-stage__dot" />
          {en ? (
            <>No live debates <span className="lb2-empty-stage__sep" aria-hidden="true">·</span> Be the first</>
          ) : (
            <>진행 중인 토론 없음 <span className="lb2-empty-stage__sep" aria-hidden="true">·</span> 첫 무대</>
          )}
        </div>

        <h3 className="serif-display lb2-empty-stage__title">
          {en ? "Don't see your topic?" : '찾는 논제가 없는가?'}
        </h3>

        <span aria-hidden="true" className="lb2-empty-stage__rule" />

        <p className="lb2-empty-stage__sub">
          {en ? (
            <>Open a stage and be the first debater. <span className="hand lb2-empty-stage__accent">The floor is yours.</span></>
          ) : (
            <>무대를 열면 당신이 첫 토론자입니다. <span className="hand lb2-empty-stage__accent">지금 시작해보세요.</span></>
          )}
        </p>

        <button
          type="button"
          className="lb2-empty-stage__cta"
          onClick={onCreate}
          disabled={!onCreate}
        >
          {en ? 'Create a room' : '토론방 만들기'}
          <span aria-hidden="true" className="lb2-empty-stage__cta-arrow">→</span>
        </button>
      </div>
    </div>
  );
}
