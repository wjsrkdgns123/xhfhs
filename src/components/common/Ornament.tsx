type OrnamentTone = 'ink' | 'fade' | 'vermillion' | 'celadon' | 'gold';

interface OrnamentProps {
  kind?: 'asterisk' | 'dot3' | 'slash' | 'fleuron';
  size?: number;
  /** Token tone for the ornament. Use a tone keyword ('ink' | 'fade' |
   *  'vermillion' | 'celadon' | 'gold') so the mark stays inside the palette and
   *  flips across paper/dusk/dawn/ink + dark. Raw hex/rgba/var() strings are
   *  rejected by the type system on purpose — keep ornaments token-only.
   *  Defaults to ink. */
  color?: OrnamentTone;
}

const TONE_MAP: Record<OrnamentTone, string> = {
  ink: 'var(--color-ink)',
  fade: 'var(--color-ink-fade)',
  vermillion: 'var(--color-vermillion)',
  celadon: 'var(--color-celadon)',
  gold: 'var(--color-gold)',
};

function resolveTone(color: OrnamentTone): string {
  return TONE_MAP[color];
}

/** Decorative inline ornament — small hand-drawn marks for editorial separators.
 *  Lifted from the debate-battle-v2 design package. Purely decorative, so every
 *  SVG carries aria-hidden.
 *  - asterisk: 8-arm asterisk star
 *  - dot3: three small dots in a row
 *  - slash: angled triple slash (newspaper-style separator)
 *  - fleuron: simplified leaf flourish */
export function Ornament({ kind = 'asterisk', size = 24, color = 'ink' }: OrnamentProps) {
  const tone = resolveTone(color);
  if (kind === 'dot3') {
    return (
      <span aria-hidden="true" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
        <span style={{ width: 4, height: 4, background: tone, borderRadius: '50%' }} />
        <span style={{ width: 4, height: 4, background: tone, borderRadius: '50%' }} />
        <span style={{ width: 4, height: 4, background: tone, borderRadius: '50%' }} />
      </span>
    );
  }

  if (kind === 'slash') {
    return (
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth="1.6" strokeLinecap="round">
        <path d="M6 18l4-12" />
        <path d="M12 18l4-12" />
        <path d="M18 18l4-12" />
      </svg>
    );
  }

  if (kind === 'fleuron') {
    return (
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4c-2 4-2 8 0 12" />
        <path d="M12 4c2 4 2 8 0 12" />
        <path d="M12 16l-3 4" />
        <path d="M12 16l3 4" />
        <circle cx="12" cy="10" r="1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth="1.6" strokeLinecap="round">
      <path d="M12 4v16" />
      <path d="M4 12h16" />
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </svg>
  );
}
