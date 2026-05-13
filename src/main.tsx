/// <reference types="vite/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './content.css';
import './content-themes.css';
import './lobby-v3.css';
import './lobby-v3-extras.css';
import './learn-hub.css';
import './scrollspy.css';
import './float-lobby.css';
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
