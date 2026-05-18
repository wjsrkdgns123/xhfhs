import { useCallback, useEffect, useState } from 'react';

export type AIModVariant = 'scroll' | 'avatar' | 'minimal';
export type VoteBarVariant = 'classic' | 'split' | 'tug' | 'beans';

const AIMOD_KEY = 'debateBattle:roomAiModVariant';
const VOTEBAR_KEY = 'debateBattle:roomVoteBarVariant';

const AIMOD_CYCLE: AIModVariant[] = ['scroll', 'avatar', 'minimal'];
const VOTEBAR_CYCLE: VoteBarVariant[] = ['classic', 'tug', 'split', 'beans'];

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const v = window.localStorage.getItem(key) as T | null;
  return v && (allowed as readonly string[]).includes(v) ? v : fallback;
}

/** Per-room v2 display prefs — AIModCard + VoteBar variants. Persisted in
 *  localStorage so users carry their pick across sessions. Cycles via a
 *  single button click. */
export function useRoomPrefs() {
  const [aiModVariant, setAiMod] = useState<AIModVariant>(() =>
    readStored<AIModVariant>(AIMOD_KEY, AIMOD_CYCLE, 'scroll'),
  );
  const [voteBarVariant, setVoteBar] = useState<VoteBarVariant>(() =>
    readStored<VoteBarVariant>(VOTEBAR_KEY, VOTEBAR_CYCLE, 'tug'),
  );

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(AIMOD_KEY, aiModVariant);
  }, [aiModVariant]);

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(VOTEBAR_KEY, voteBarVariant);
  }, [voteBarVariant]);

  const cycleAiMod = useCallback(() => {
    setAiMod((cur) => {
      const i = AIMOD_CYCLE.indexOf(cur);
      return AIMOD_CYCLE[(i + 1) % AIMOD_CYCLE.length];
    });
  }, []);

  const cycleVoteBar = useCallback(() => {
    setVoteBar((cur) => {
      const i = VOTEBAR_CYCLE.indexOf(cur);
      return VOTEBAR_CYCLE[(i + 1) % VOTEBAR_CYCLE.length];
    });
  }, []);

  return { aiModVariant, voteBarVariant, cycleAiMod, cycleVoteBar };
}
