/**
 * KakaoShareButton — 카카오톡 피드 카드 공유 버튼.
 *
 * - VITE_KAKAO_JS_KEY 환경변수가 있으면 카카오 JS SDK를 동적으로 로드해
 *   Kakao.Share.sendDefault() 로 리치 피드 카드를 전송합니다.
 * - 키가 없거나 SDK 로드/초기화에 실패하면 navigator.clipboard 로 링크를
 *   복사하고 토스트로 안내합니다. 앱이 깨지지 않도록 항상 graceful fallback.
 * - 카카오 공유 링크에는 &src=kakao 파라미터를 붙여 유입 경로를 구분합니다.
 */

import { useState } from 'react';
import { showToast } from './Toast';
import { useLocale } from '../hooks/useLocale';
import { roomStrings } from '../i18n/room';

/** 카카오 JS SDK 전역 타입 (최소한만 선언) */
declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share?: {
        sendDefault: (opts: KakaoFeedParams) => void;
      };
    };
  }
}

interface KakaoFeedParams {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: { mobileWebUrl: string; webUrl: string };
  };
  buttons: Array<{
    title: string;
    link: { mobileWebUrl: string; webUrl: string };
  }>;
}

/** SDK 스크립트를 한 번만 로드하기 위한 모듈-레벨 Promise 캐시 */
let sdkLoadPromise: Promise<boolean> | null = null;

function loadKakaoSdk(): Promise<boolean> {
  if (sdkLoadPromise) return sdkLoadPromise;
  sdkLoadPromise = new Promise((resolve) => {
    const jsKey = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;
    if (!jsKey || jsKey.trim() === '') {
      resolve(false);
      return;
    }
    // 이미 로드되어 있으면 초기화만
    if (typeof window !== 'undefined' && window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        try { window.Kakao.init(jsKey); } catch { /* noop */ }
      }
      resolve(window.Kakao.isInitialized());
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
    script.integrity = 'sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      try {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(jsKey);
        }
        resolve(window.Kakao?.isInitialized() ?? false);
      } catch {
        resolve(false);
      }
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return sdkLoadPromise;
}

/** 방 링크를 만든다. src 플랫폼 구분 + t 주제 쿼리 포함 */
function makeRoomUrl(roomId: string, topic: string, src: string = 'kakao'): string {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ddatebattle.site';
  return `${origin}/?room=${encodeURIComponent(roomId)}&src=${src}&t=${encodeURIComponent(topic)}`;
}

interface KakaoShareButtonProps {
  roomId: string;
  topic: string;
  /** 버튼 크기 변형 — 기본 'md' */
  size?: 'sm' | 'md';
  /** 추가 style */
  style?: React.CSSProperties;
}

export function KakaoShareButton({
  roomId,
  topic,
  size = 'md',
  style,
}: KakaoShareButtonProps) {
  const { lang } = useLocale();
  const t = roomStrings[lang].share;
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (loading) return;
    setLoading(true);
    const url = makeRoomUrl(roomId, topic, 'kakao');

    try {
      const ready = await loadKakaoSdk();
      if (ready && window.Kakao?.Share) {
        // TODO: /og-image.png 가 없으면 아래 imageUrl을 실제 호스팅 이미지 URL로 교체하세요.
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: topic,
            description: t.description,
            imageUrl: 'https://ddatebattle.site/og-image.png',
            link: { mobileWebUrl: url, webUrl: url },
          },
          buttons: [
            {
              title: t.btnEnter,
              link: { mobileWebUrl: url, webUrl: url },
            },
          ],
        });
      } else {
        // fallback: 링크 복사
        await copyLink(url, lang);
      }
    } catch {
      // SDK 오류 시 항상 클립보드 fallback
      await copyLink(url, lang);
    } finally {
      setLoading(false);
    }
  };

  const paddingMap = { sm: '4px 10px', md: '8px 16px' };
  const fontSizeMap = { sm: 12, md: 14 };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={loading}
      className="btn"
      aria-label={t.ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: paddingMap[size],
        fontSize: fontSizeMap[size],
        fontWeight: 700,
        background: '#FEE500',
        color: '#3C1E1E',
        /* 다크 모드에서도 노란 배경 위에서 확실히 보이도록 고정 어두운 색 사용 */
        border: '1.5px solid #3C1E1E',
        boxShadow: '2px 2px 0 #3C1E1E',
        cursor: loading ? 'wait' : 'pointer',
        flexShrink: 0,
        wordBreak: 'keep-all',
        ...style,
      }}
    >
      {/* 카카오 말풍선 아이콘 (SVG inline — 외부 이미지 의존성 없음) */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="#3C1E1E"
      >
        <path d="M12 3C6.477 3 2 6.582 2 11c0 2.849 1.657 5.357 4.192 6.897L5.1 21.1a.5.5 0 0 0 .7.67l4.62-2.6A11.6 11.6 0 0 0 12 19c5.523 0 10-3.582 10-8S17.523 3 12 3z" />
      </svg>
      {loading ? t.loading : t.label}
    </button>
  );
}

/** 링크를 클립보드에 복사하고 토스트로 안내 */
async function copyLink(url: string, lang: 'ko' | 'en') {
  const tShare = roomStrings[lang].share;
  try {
    await navigator.clipboard.writeText(url);
    showToast(tShare.fallbackCopied, 'success');
  } catch {
    // clipboard API 실패 시 prompt
    try {
      window.prompt(lang === 'en' ? 'Copy this link:' : '링크를 복사하세요:', url);
    } catch { /* noop */ }
  }
}
