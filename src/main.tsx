/// <reference types="vite/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
/* v2-system.css — bare-name token aliases, missing utility classes
   (.btn--, .chip--, .status--, .toggle-pill, .brand, animations),
   and the [data-theme="ink"] alias for the original v2 package's
   dark-theme name. Loaded right after index.css so it can layer on. */
import './v2-system.css';
import './content.css';
import './content-themes.css';
import './content-formats.css';
import './lobby-v3.css';
import './lobby-v3-extras.css';
import './learn-hub.css';
import './scrollspy.css';
import './float-lobby.css';
import './footer.css';
import './learn-dropdown.css';
import './a11y.css';
import './toast.css';
/* v2 "게임+교육" 디자인 시스템 (Claude Design 핸드오프) — 새 토큰/프리미티브 기반.
   기존 index.css / v2-system.css 의 신문 네오브루탈 전역 토큰·프리미티브 위에
   **마지막으로** 로드해, 둥근 corner·소프트 그림자·sage 무대·코인 룩을 새 기반으로 삼는다.
   페이지별 scoped CSS(.lobby-v3 등)는 특이도가 높아 그대로 유지되며 화면 단계에서 교체. */
import './design-system/colors_and_type.css';
import './design-system/components.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// PWA: register service worker (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[sw register failed]', err);
    });
  });
}
