/**
 * ShareMenu — 범용 공유 버튼 컴포넌트.
 *
 * 동작 방식:
 * 1. 모바일/Web Share API 지원 브라우저: navigator.share() 호출 → OS 기본 공유 시트
 *    (디스코드·카카오·X·문자 등 설치된 모든 앱으로 바로 전송)
 * 2. 데스크톱 등 미지원 환경: 작은 드롭다운 메뉴
 *    - X(트위터) 인텐트 링크
 *    - 링크 복사(navigator.clipboard)
 *
 * 공유 URL 규격: /?room=<id>&src=<platform>&t=<주제>
 * src 값: native | x | copy
 */

import { useEffect, useRef, useState } from 'react';
import { showToast } from './Toast';
import { useLocale } from '../hooks/useLocale';

/** 방 링크를 규격대로 생성 */
export function makeShareUrl(
  roomId: string,
  topic: string,
  src: 'native' | 'x' | 'copy',
): string {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ddatebattle.site';
  return `${origin}/?room=${encodeURIComponent(roomId)}&src=${src}&t=${encodeURIComponent(topic)}`;
}

interface ShareMenuProps {
  roomId: string;
  topic: string;
  /** 버튼 크기 변형 — 기본 'sm' */
  size?: 'sm' | 'md';
  /** 추가 style */
  style?: React.CSSProperties;
}

export function ShareMenu({ roomId, topic, size = 'sm', style }: ShareMenuProps) {
  const { lang } = useLocale();
  const t = useLocale().t.room.shareMenu;

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  /* 메뉴 바깥 클릭 시 닫기 */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* ESC 로 닫기 */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleClick = async () => {
    if (busy) return;

    /* Web Share API 지원 여부 확인 */
    const canShare = typeof navigator !== 'undefined' && !!navigator.share;

    if (canShare) {
      setBusy(true);
      try {
        const url = makeShareUrl(roomId, topic, 'native');
        await navigator.share({
          title: t.nativeTitle,
          text: t.nativeText(topic),
          url,
        });
      } catch (err) {
        /* 사용자가 취소한 경우(AbortError)는 무시 */
        if (err instanceof Error && err.name !== 'AbortError') {
          /* 실패 시 드롭다운 폴백 */
          setOpen((prev) => !prev);
        }
      } finally {
        setBusy(false);
      }
    } else {
      /* 데스크톱 — 드롭다운 토글 */
      setOpen((prev) => !prev);
    }
  };

  const handleX = () => {
    const url = makeShareUrl(roomId, topic, 'x');
    const text = t.nativeText(topic);
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(intent, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const handleCopy = async () => {
    const url = makeShareUrl(roomId, topic, 'copy');
    try {
      await navigator.clipboard.writeText(url);
      showToast(t.copied, 'success');
    } catch {
      try {
        window.prompt(lang === 'en' ? 'Copy this link:' : '링크를 복사하세요:', url);
      } catch { /* noop */ }
      showToast(t.copyFailed, 'error');
    }
    setOpen(false);
  };

  const paddingMap = { sm: '4px 10px', md: '8px 16px' };
  const fontSizeMap = { sm: 12, md: 14 };

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: paddingMap[size],
    fontSize: fontSizeMap[size],
    fontWeight: 700,
    background: 'var(--color-paper-light)',
    color: 'var(--color-ink)',
    border: '1.5px solid var(--color-ink)',
    boxShadow: '2px 2px 0 var(--color-ink)',
    cursor: busy ? 'wait' : 'pointer',
    flexShrink: 0,
    wordBreak: 'keep-all',
    position: 'relative' as const,
    ...style,
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="btn"
        aria-label={t.ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        style={btnStyle}
      >
        {/* 공유 아이콘 (화살표 위로) */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        {t.label}
      </button>

      {/* 드롭다운 메뉴 — Web Share API 미지원 시 */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={t.ariaLabel}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 9999,
            minWidth: 160,
            background: 'var(--color-paper-light)',
            border: '1.5px solid var(--color-ink)',
            boxShadow: '3px 3px 0 var(--color-ink)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {/* X(트위터) */}
          <button
            type="button"
            role="menuitem"
            onClick={handleX}
            style={menuItemStyle}
            onMouseEnter={(e) => applyHover(e, true)}
            onMouseLeave={(e) => applyHover(e, false)}
          >
            {/* X 로고 (SVG inline) */}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            {t.xLabel}
          </button>

          {/* 구분선 */}
          <div
            style={{
              height: 1,
              background: 'var(--color-ink)',
              opacity: 0.12,
              margin: '0 10px',
            }}
          />

          {/* 링크 복사 */}
          <button
            type="button"
            role="menuitem"
            onClick={handleCopy}
            style={menuItemStyle}
            onMouseEnter={(e) => applyHover(e, true)}
            onMouseLeave={(e) => applyHover(e, false)}
          >
            {/* 복사 아이콘 */}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {t.copyLabel}
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-ink)',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  wordBreak: 'keep-all',
  transition: 'background 0.12s',
};

function applyHover(
  e: React.MouseEvent<HTMLButtonElement>,
  isEnter: boolean,
) {
  (e.currentTarget as HTMLButtonElement).style.background = isEnter
    ? 'var(--color-paper-deep)'
    : 'transparent';
}
