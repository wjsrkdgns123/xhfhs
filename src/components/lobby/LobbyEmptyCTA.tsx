import type { Lang } from '../../i18n/landing';

/** v2 empty-state — "비어있지만 의도된 신문 1면 빈 무대" 톤.
 *  강조 절제(eyebrow → serif 제목 → 잉크 밑줄 → 손글씨 본문)로 수직 위계를 또렷이.
 *  도장·하드오프셋 프레임은 덜고, 큰 한자(開) 워터마크는 배경으로만 은은하게.
 *  버튼 없음 — 히어로·검색바의 "토론방 만들기"가 1차 행동. */
export function LobbyEmptyCTA({ lang }: { lang: Lang }) {
  return (
    <div className="lb2-empty-stage" role="region" aria-label={lang === 'en' ? 'Empty lobby' : '빈 토론장'}>
      <span aria-hidden="true" className="lb2-empty-stage__glyph">開</span>

      <div className="lb2-empty-stage__body">
        <div className="lb2-empty-stage__eyebrow">
          <span aria-hidden="true" className="lb2-empty-stage__dot" />
          {lang === 'en' ? 'No live debates · Be the first' : '진행 중인 토론 없음 · 첫 무대'}
        </div>

        <h3 className="serif-display lb2-empty-stage__title">
          {lang === 'en' ? "Don't see your topic?" : '찾는 논제가 없는가?'}
        </h3>

        <span aria-hidden="true" className="lb2-empty-stage__rule" />

        <p className="lb2-empty-stage__sub hand">
          {lang === 'en'
            ? 'Open the stage now and be the first debater — use the "Create room" button above.'
            : `지금 무대를 열면 첫 토론자다. 위의 '토론방 만들기' 버튼으로 무대를 열어보세요.`}
        </p>
      </div>
    </div>
  );
}
