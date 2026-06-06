import { useEffect, useState } from 'react';

type ToastKind = 'info' | 'error' | 'success';
interface ToastMsg {
  id: number;
  text: string;
  kind: ToastKind;
}
interface ToastView extends ToastMsg {
  /** true once the toast enters its final moments before auto-dismiss */
  expiring?: boolean;
}

let listeners: ((msg: ToastMsg) => void)[] = [];
let nextId = 1;

/** Newspaper-style mono labels per kind — replaces emoji icons for
 *  brand consistency and screen-reader clarity. */
const LABELS: Record<ToastKind, string> = {
  info: '안내',
  success: '완료',
  error: '오류',
};

/** Ink-seal glyph per kind — a small stamped mark that carries meaning
 *  alongside the label/color, in keeping with the newspaper tone. */
const SEALS: Record<ToastKind, string> = {
  info: '알',
  success: '완',
  error: '!',
};

/** Auto-dismiss timing per kind. Errors linger longer so users have
 *  time to read the cause and recover. */
const DURATION: Record<ToastKind, number> = {
  info: 5000,
  success: 4200,
  error: 7000,
};

/** Window (ms) before dismissal where the thin "printed rule" timer
 *  animates out — a quiet last-moments cue, not a full progress bar. */
const EXPIRE_CUE = 1000;
const MAX_VISIBLE = 3;

/**
 * showToast — fire a toast from anywhere. Imperative API so existing
 * alert() call sites can be swapped one-for-one without prop drilling.
 */
export function showToast(text: string, kind: ToastKind = 'info') {
  const msg: ToastMsg = { id: nextId++, text, kind };
  listeners.forEach((l) => l(msg));
}

/**
 * ToastHost — mount once in the app root. Receives messages via the
 * imperative showToast() function and renders them as bottom-right
 * stacked pills that auto-dismiss after ~4.5s. Reduced motion users
 * get a static appearance.
 */
export function ToastHost() {
  const [msgs, setMsgs] = useState<ToastView[]>([]);

  useEffect(() => {
    const onMsg = (m: ToastMsg) => {
      setMsgs((cur) => [...cur, m]);
      const life = DURATION[m.kind];
      // Flag the final moments so the thin printed-rule timer can animate.
      window.setTimeout(() => {
        setMsgs((cur) => cur.map((x) => (x.id === m.id ? { ...x, expiring: true } : x)));
      }, Math.max(0, life - EXPIRE_CUE));
      window.setTimeout(() => {
        setMsgs((cur) => cur.filter((x) => x.id !== m.id));
      }, life);
    };
    listeners.push(onMsg);
    return () => {
      listeners = listeners.filter((l) => l !== onMsg);
    };
  }, []);

  const dismiss = (id: number) => setMsgs((cur) => cur.filter((m) => m.id !== id));

  // Show only the most recent toasts; older ones collapse off-stack to
  // keep the corner uncluttered. Newest sits closest to the thumb zone.
  const visible = msgs.slice(-MAX_VISIBLE);

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {visible.map((m) => (
        <div
          key={m.id}
          className={`toast toast--${m.kind}`}
          data-expiring={m.expiring ? 'true' : undefined}
          style={{ ['--toast-life' as string]: `${EXPIRE_CUE}ms` }}
          role={m.kind === 'error' ? 'alert' : undefined}
        >
          <span className="toast__mark" aria-hidden="true">{SEALS[m.kind]}</span>
          <div className="toast__body">
            <p className="toast__eyebrow" aria-hidden="true">{LABELS[m.kind]}</p>
            <p className="toast__text">{m.text}</p>
          </div>
          <button
            type="button"
            className="toast__close"
            aria-label="알림 닫기"
            onClick={() => dismiss(m.id)}
          >
            ×
          </button>
          <span className="toast__timer" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
