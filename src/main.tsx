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
import App from './App';
import { hasConsent, loadAdSense } from './lib/ads';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// #16: load AdSense for returning visitors who already consented. First-time
// visitors get it when they accept the cookie banner (see CookieBanner).
if (hasConsent()) loadAdSense();

// PWA: register service worker (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[sw register failed]', err);
    });
  });
}
