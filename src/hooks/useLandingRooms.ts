import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db, firebaseConfigured } from '../firebase';
import type { Phase, Side } from '../types';

export interface LandingRoom {
  id: string;
  topic: string;
  proName: string | null;
  conName: string | null;
  proUid: string | null;
  conUid: string | null;
  status: 'open' | 'live';
  phase?: Phase;
  plannedRounds?: number;
  extendRound?: number;
  createdAt: number;
  proVotes: number;
  conVotes: number;
  totalVotes: number;
}

export interface LandingData {
  ready: boolean;
  /** true when at least one live/open room exists — gates real vs. honest-fallback UI */
  hasActive: boolean;
  stats: { live: number; open: number; today: number };
  featured: LandingRoom | null;
  /** active rooms after the featured one (for the hero side rows) — up to 2 */
  rows: LandingRoom[];
  /** active rooms for the "오늘의 논제" grid — up to 3, live first */
  motions: LandingRoom[];
}

const EMPTY: LandingData = {
  ready: false,
  hasActive: false,
  stats: { live: 0, open: 0, today: 0 },
  featured: null,
  rows: [],
  motions: [],
};

/** Start-of-today epoch ms in KST (UTC+9, no DST). */
function kstTodayStartMs(): number {
  const KST = 9 * 60 * 60 * 1000;
  const now = Date.now();
  return Math.floor((now + KST) / 86_400_000) * 86_400_000 - KST;
}

interface RawRoom {
  id: string;
  topic: string;
  proName: string | null;
  conName: string | null;
  proUid: string | null;
  conUid: string | null;
  status: 'open' | 'live';
  phase?: Phase;
  plannedRounds?: number;
  extendRound?: number;
  createdAt: number;
}

/**
 * Real landing data: subscribes to live/open rooms and, for the handful of rooms
 * actually shown (featured + side rows + motions grid), to their vote subcollections
 * so the vote bars reflect real tallies. Everything degrades to an honest empty
 * state (`hasActive: false`) when Firestore is unconfigured or no room is active —
 * the landing then shows product-fact copy instead of fabricated numbers.
 */
export function useLandingRooms(): LandingData {
  const [rawRooms, setRawRooms] = useState<RawRoom[] | null>(null);
  const [votesByRoom, setVotesByRoom] = useState<Record<string, { pro: number; con: number }>>({});

  // --- 1. active rooms ---
  useEffect(() => {
    if (!firebaseConfigured || !db) {
      setRawRooms([]);
      return;
    }
    const q = query(
      collection(db, 'rooms'),
      where('status', 'in', ['live', 'open']),
      limit(20),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rooms: RawRoom[] = [];
        snap.forEach((d) => {
          const v = d.data() as Record<string, unknown>;
          const status = v.status as string;
          if (status !== 'live' && status !== 'open') return;
          rooms.push({
            id: d.id,
            topic: (v.topic as string) ?? '',
            proName: (v.proName as string | null) ?? null,
            conName: (v.conName as string | null) ?? null,
            proUid: (v.proUid as string | null) ?? null,
            conUid: (v.conUid as string | null) ?? null,
            status: status as 'open' | 'live',
            phase: v.phase as Phase | undefined,
            plannedRounds: v.plannedRounds as number | undefined,
            extendRound: v.extendRound as number | undefined,
            createdAt: (v.createdAt as number) ?? 0,
          });
        });
        setRawRooms(rooms);
      },
      () => setRawRooms([]),
    );
    return () => unsub();
  }, []);

  // --- 2. sort + slice (live first, newest first) ---
  const sorted = useMemo(() => {
    if (!rawRooms) return null;
    return [...rawRooms].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'live' ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
  }, [rawRooms]);

  // The rooms we actually render — watch only these for votes (bounded reads).
  const shownIds = useMemo(() => (sorted ? sorted.slice(0, 5).map((r) => r.id) : []), [sorted]);
  const shownKey = shownIds.join(',');

  // --- 3. vote tallies for shown rooms ---
  useEffect(() => {
    if (!db || shownIds.length === 0) {
      setVotesByRoom({});
      return;
    }
    const unsubs = shownIds.map((roomId) =>
      onSnapshot(
        collection(db!, 'rooms', roomId, 'votes'),
        (snap) => {
          let pro = 0;
          let con = 0;
          snap.forEach((d) => {
            const side = (d.data() as { side?: Side }).side;
            if (side === 'pro') pro += 1;
            else if (side === 'con') con += 1;
          });
          setVotesByRoom((prev) => ({ ...prev, [roomId]: { pro, con } }));
        },
        () => {},
      ),
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownKey]);

  // --- 4. assemble ---
  return useMemo<LandingData>(() => {
    if (!sorted) return EMPTY;

    const todayStart = kstTodayStartMs();
    const stats = {
      live: sorted.filter((r) => r.status === 'live').length,
      open: sorted.filter((r) => r.status === 'open').length,
      today: sorted.filter((r) => r.createdAt >= todayStart).length,
    };

    const decorate = (r: RawRoom): LandingRoom => {
      const v = votesByRoom[r.id] ?? { pro: 0, con: 0 };
      return { ...r, proVotes: v.pro, conVotes: v.con, totalVotes: v.pro + v.con };
    };

    const all = sorted.map(decorate);
    const live = all.filter((r) => r.status === 'live');
    const featured = live[0] ?? all[0] ?? null;
    const rest = featured ? all.filter((r) => r.id !== featured.id) : all;

    return {
      ready: true,
      hasActive: all.length > 0,
      stats,
      featured,
      rows: rest.slice(0, 2),
      motions: all.slice(0, 3),
    };
  }, [sorted, votesByRoom]);
}
