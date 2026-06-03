// #16: AdSense loads ONLY after the user accepts the cookie/consent banner —
// not unconditionally in index.html <head>. Returning visitors who already
// consented get it on app init (main.tsx); first-time visitors get it the
// moment they click "동의" in CookieBanner. Keeps the consent banner real
// (it now gates ad/tracking scripts) instead of decorative.
const ADSENSE_SRC =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6219520263101018';

export const CONSENT_KEY = 'debateBattle:cookieConsent';

let injected = false;

/** Inject the AdSense script once. Idempotent. */
export function loadAdSense(): void {
  if (injected || typeof document === 'undefined') return;
  // Never load ad/tracking scripts in local dev. AdSense beacons continuously,
  // which keeps the dev page from ever reaching network-idle and makes the
  // preview screenshot tool time out. Production builds load it normally.
  if (import.meta.env.DEV) return;
  if (document.querySelector('script[data-ad-loader]')) {
    injected = true;
    return;
  }
  const s = document.createElement('script');
  s.async = true;
  s.src = ADSENSE_SRC;
  s.crossOrigin = 'anonymous';
  s.setAttribute('data-ad-loader', '');
  document.head.appendChild(s);
  injected = true;
}

/** Whether the user has accepted the cookie/consent banner. */
export function hasConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
}
