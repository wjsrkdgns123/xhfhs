import type { CSSProperties } from 'react';

export type AvatarId = 'char1' | 'char2' | 'char3' | 'char4';

export const DEFAULT_AVATARS: { id: AvatarId; name: string; tagline: string }[] = [
  { id: 'char1', name: '학자', tagline: '차분한 분석가' },
  { id: 'char2', name: '활동가', tagline: '뜨거운 감정파' },
  { id: 'char3', name: '냉철', tagline: '날선 논리파' },
  { id: 'char4', name: '농담왕', tagline: '여유 만만' },
];

interface DefaultAvatarProps {
  id: AvatarId;
  size?: number;
}

export function DefaultAvatar({ id, size = 64 }: DefaultAvatarProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* paper background circle */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="var(--color-paper-light)"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      {id === 'char1' && Char1()}
      {id === 'char2' && Char2()}
      {id === 'char3' && Char3()}
      {id === 'char4' && Char4()}
    </svg>
  );
}

// 학자 — round glasses, neat side-parted hair, calm
function Char1() {
  return (
    <g>
      {/* shoulders */}
      <path
        d="M 18 92 Q 22 70 50 65 Q 78 70 82 92 Z"
        fill="rgba(45, 74, 90, 0.18)"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      {/* collar */}
      <path d="M 38 70 L 50 78 L 62 70 L 60 84 L 50 86 L 40 84 Z" fill="var(--color-paper-light)" stroke="var(--color-ink)" strokeWidth="1.5" />
      {/* head */}
      <ellipse cx="50" cy="40" rx="20" ry="22" fill="var(--color-paper-light)" stroke="var(--color-ink)" strokeWidth="2" />
      {/* hair (side-parted) */}
      <path d="M 30 38 Q 32 18 50 18 Q 70 20 70 38 Q 64 30 50 30 Q 38 32 30 38 Z" fill="var(--color-ink)" />
      <path d="M 35 30 Q 50 26 60 30" stroke="var(--color-paper-light)" strokeWidth="1" fill="none" opacity="0.4" />
      {/* glasses */}
      <circle cx="42" cy="42" r="5" fill="none" stroke="var(--color-ink)" strokeWidth="1.5" />
      <circle cx="58" cy="42" r="5" fill="none" stroke="var(--color-ink)" strokeWidth="1.5" />
      <line x1="47" y1="42" x2="53" y2="42" stroke="var(--color-ink)" strokeWidth="1.5" />
      {/* mouth (calm) */}
      <path d="M 44 53 Q 50 56 56 53" stroke="var(--color-ink)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  );
}

// 활동가 — wild hair, scarf, intense eyes
function Char2() {
  return (
    <g>
      <path
        d="M 18 92 Q 22 70 50 65 Q 78 70 82 92 Z"
        fill="rgba(200, 75, 31, 0.22)"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      {/* scarf */}
      <path d="M 35 65 Q 50 78 65 65 L 70 75 L 58 82 L 50 78 L 42 82 L 30 75 Z" fill="var(--color-vermillion)" stroke="var(--color-ink)" strokeWidth="1.5" />
      <ellipse cx="50" cy="40" rx="20" ry="22" fill="var(--color-paper-light)" stroke="var(--color-ink)" strokeWidth="2" />
      {/* wild messy hair */}
      <path d="M 28 35 L 30 18 L 36 28 L 40 14 L 46 28 L 52 14 L 58 28 L 64 16 L 68 28 L 72 35 Q 60 30 50 30 Q 38 32 28 35 Z" fill="var(--color-ink)" />
      {/* eyes (intense) */}
      <path d="M 38 41 L 46 41" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
      <path d="M 54 41 L 62 41" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="42" cy="44" r="1.8" fill="var(--color-ink)" />
      <circle cx="58" cy="44" r="1.8" fill="var(--color-ink)" />
      {/* mouth (open, passionate) */}
      <ellipse cx="50" cy="55" rx="3.5" ry="2.5" fill="var(--color-ink)" />
    </g>
  );
}

// 냉철 — sharp angular hair, suit, sharp eyes, slight smirk
function Char3() {
  return (
    <g>
      <path
        d="M 18 92 Q 22 70 50 65 Q 78 70 82 92 Z"
        fill="rgba(26, 15, 8, 0.22)"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      {/* tie */}
      <path d="M 47 70 L 53 70 L 54 78 L 50 86 L 46 78 Z" fill="var(--color-celadon)" stroke="var(--color-ink)" strokeWidth="1.2" />
      {/* lapels */}
      <path d="M 32 72 L 47 72 L 50 86 L 32 90 Z" fill="rgba(26,15,8,0.4)" stroke="var(--color-ink)" strokeWidth="1.5" />
      <path d="M 68 72 L 53 72 L 50 86 L 68 90 Z" fill="rgba(26,15,8,0.4)" stroke="var(--color-ink)" strokeWidth="1.5" />
      <ellipse cx="50" cy="40" rx="20" ry="22" fill="var(--color-paper-light)" stroke="var(--color-ink)" strokeWidth="2" />
      {/* sharp angular hair */}
      <path d="M 30 36 L 34 18 L 42 32 L 50 16 L 58 32 L 66 18 L 70 36 Q 60 28 50 28 Q 38 30 30 36 Z" fill="var(--color-ink)" />
      {/* sharp eyebrows */}
      <path d="M 38 38 L 46 36" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
      <path d="M 62 38 L 54 36" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
      {/* sharp eyes */}
      <path d="M 38 43 L 46 44" stroke="var(--color-ink)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 62 43 L 54 44" stroke="var(--color-ink)" strokeWidth="1.8" strokeLinecap="round" />
      {/* smirk */}
      <path d="M 44 54 Q 50 56 58 52" stroke="var(--color-ink)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  );
}

// 농담왕 — beanie, big smile, casual jacket, freckle dot
function Char4() {
  return (
    <g>
      <path
        d="M 18 92 Q 22 70 50 65 Q 78 70 82 92 Z"
        fill="rgba(184, 132, 42, 0.25)"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      {/* hoodie strings */}
      <line x1="46" y1="72" x2="46" y2="85" stroke="var(--color-ink)" strokeWidth="1.2" />
      <line x1="54" y1="72" x2="54" y2="85" stroke="var(--color-ink)" strokeWidth="1.2" />
      <ellipse cx="50" cy="40" rx="20" ry="22" fill="var(--color-paper-light)" stroke="var(--color-ink)" strokeWidth="2" />
      {/* beanie */}
      <path d="M 28 32 Q 32 14 50 12 Q 68 14 72 32 Z" fill="var(--color-gold)" stroke="var(--color-ink)" strokeWidth="2" />
      <line x1="34" y1="22" x2="66" y2="22" stroke="var(--color-ink)" strokeWidth="1.5" opacity="0.5" />
      <circle cx="50" cy="14" r="3" fill="var(--color-vermillion)" stroke="var(--color-ink)" strokeWidth="1.2" />
      {/* eyes (smiling crescents) */}
      <path d="M 38 42 Q 42 38 46 42" stroke="var(--color-ink)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 54 42 Q 58 38 62 42" stroke="var(--color-ink)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* freckle */}
      <circle cx="36" cy="50" r="0.8" fill="var(--color-ink)" />
      <circle cx="64" cy="50" r="0.8" fill="var(--color-ink)" />
      {/* big smile */}
      <path d="M 40 52 Q 50 60 60 52" stroke="var(--color-ink)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

// Profile avatar — picks between uploaded image and default character
interface ProfileAvatarProps {
  avatarId?: AvatarId | null;
  avatarDataUrl?: string | null;
  size?: number;
  style?: CSSProperties;
  ring?: 'pro' | 'con' | 'ink' | null;
}

export function ProfileAvatar({
  avatarId,
  avatarDataUrl,
  size = 64,
  style,
  ring = null,
}: ProfileAvatarProps) {
  const ringColor =
    ring === 'pro'
      ? 'var(--color-vermillion)'
      : ring === 'con'
        ? 'var(--color-celadon)'
        : ring === 'ink'
          ? 'var(--color-ink)'
          : 'var(--color-ink)';
  const wrapStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    border: `${ring ? 2.5 : 1.5}px solid ${ringColor}`,
    background: 'var(--color-paper-light)',
    display: 'inline-block',
    flexShrink: 0,
    ...style,
  };
  if (avatarDataUrl) {
    return (
      <span style={wrapStyle}>
        <img
          src={avatarDataUrl}
          alt=""
          width={size}
          height={size}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </span>
    );
  }
  const id: AvatarId = (avatarId as AvatarId) ?? 'char1';
  return (
    <span style={wrapStyle}>
      <DefaultAvatar id={id} size={size} />
    </span>
  );
}
