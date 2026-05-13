import '../landing.css';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function NotFoundView({ onHome }: { onHome: () => void }) {
  useDocumentMeta(
    '404 — 페이지를 찾을 수 없습니다',
    '요청하신 페이지를 찾을 수 없습니다. 토론배틀 메인으로 돌아가세요.',
  );
  return (
    <div className="landing-page">
      <section style={{ padding: '120px 0 140px', textAlign: 'center' }}>
        <div className="wrap-narrow" style={{ maxWidth: 640 }}>
          <div
            className="section-eyebrow"
            style={{ justifyContent: 'center', display: 'inline-flex' }}
          >
            404 · NOT FOUND
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: 'clamp(72px, 14vw, 180px)',
              lineHeight: 1,
              letterSpacing: '-0.04em',
              color: 'var(--color-vermillion)',
              margin: '8px 0 18px',
            }}
          >
            404
          </h1>
          <h2
            className="section-title"
            style={{ fontSize: 'clamp(28px, 5vw, 44px)', marginBottom: 16 }}
          >
            <span className="hand">길을 잃었네요.</span>
          </h2>
          <p
            style={{
              fontSize: 16,
              color: 'var(--color-ink-soft)',
              maxWidth: 460,
              margin: '0 auto 36px',
              lineHeight: 1.65,
            }}
          >
            요청하신 페이지가 존재하지 않거나, 옮겨졌거나, 만료된 토론방일
            수 있습니다.
          </p>
          <button type="button" onClick={onHome} className="lpbtn lpbtn--pri lpbtn--lg">
            🏠 토론장으로 돌아가기
          </button>
        </div>
      </section>
    </div>
  );
}
