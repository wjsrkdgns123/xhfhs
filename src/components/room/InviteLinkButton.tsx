import { useState } from 'react';
import type { Lang } from '../../i18n/landing';

export function InviteLinkButton({ roomId, lang }: { roomId: string; lang: Lang }) {
  const [copied, setCopied] = useState<'link' | 'id' | null>(null);
  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=${roomId}`
      : '';

  const copy = async (what: 'link' | 'id') => {
    const text = what === 'link' ? url : roomId;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      window.prompt(lang === 'en' ? 'Copy this text:' : '복사할 텍스트:', text);
    }
  };

  const labels = lang === 'en'
    ? { private: '🔒 Private', link: '🔗 Invite link', linkCopied: '✓ Link copied', id: 'Copy ID', idCopied: '✓ ID copied' }
    : { private: '🔒 비공개방', link: '🔗 초대 링크', linkCopied: '✓ 링크 복사됨', id: 'ID 복사', idCopied: '✓ ID 복사됨' };

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs"
        style={{ color: 'var(--color-ink-fade)' }}
      >
        {labels.private}
      </span>
      <button
        type="button"
        onClick={() => copy('link')}
        style={{
          padding: '5px 13px',
          fontSize: 12,
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          borderRadius: 'var(--r-pill)',
          background: 'var(--color-paper-deep)',
          border: '1px solid var(--color-line)',
          color: 'var(--color-ink-soft)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {copied === 'link' ? labels.linkCopied : labels.link}
      </button>
      <button
        type="button"
        onClick={() => copy('id')}
        style={{
          padding: '5px 12px',
          fontSize: 12,
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          borderRadius: 'var(--r-pill)',
          background: 'transparent',
          border: '1px solid var(--color-line)',
          color: 'var(--color-ink-fade)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {copied === 'id' ? labels.idCopied : labels.id}
      </button>
    </div>
  );
}
