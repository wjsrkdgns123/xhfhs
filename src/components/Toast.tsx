import { useEffect, useState } from 'react';

type ToastKind = 'info' | 'error' | 'success';
interface ToastMsg {
  id: number;
  text: string;
  kind: ToastKind;
}

let listeners: ((msg: ToastMsg) => void)[] = [];
let nextId = 1;

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
  const [msgs, setMsgs] = useState<ToastMsg[]>([]);

  useEffect(() => {
    const onMsg = (m: ToastMsg) => {
      setMsgs((cur) => [...cur, m]);
      window.setTimeout(() => {
        setMsgs((cur) => cur.filter((x) => x.id !== m.id));
      }, 4500);
    };
    listeners.push(onMsg);
    return () => {
      listeners = listeners.filter((l) => l !== onMsg);
    };
  }, []);

  const dismiss = (id: number) => setMsgs((cur) => cur.filter((m) => m.id !== id));

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {msgs.map((m) => (
        <div key={m.id} className={`toast toast--${m.kind}`}>
          <span className="toast__icon" aria-hidden="true">
            {m.kind === 'error' ? '⚠️' : m.kind === 'success' ? '✓' : 'ℹ'}
          </span>
          <span className="toast__text">{m.text}</span>
          <button
            type="button"
            className="toast__close"
            aria-label="알림 닫기"
            onClick={() => dismiss(m.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
