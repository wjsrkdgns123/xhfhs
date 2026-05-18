import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import type { UserProfile } from '../types';

export interface ChampionEntry {
  uid: string;
  name: string;
  wins: number;
  losses: number;
  rate: number;
}

interface UseWeeklyChampionsResult {
  champions: ChampionEntry[] | null;
  loading: boolean;
}

/**
 * Top debaters by win rate among recently active users. Powers the Champions
 * section on the landing page.
 *
 * Strategy: pull top 50 users by `totalDebates`, sort client-side by win rate
 * with a minimum-sample floor so a 1-and-0 user can't beat someone with 12-and-3.
 *
 * Returns `null` when Firestore is unconfigured or no qualifying user exists —
 * callers should fall back to placeholder copy.
 */
export function useWeeklyChampions(topN: number = 4): UseWeeklyChampionsResult {
  const [champions, setChampions] = useState<ChampionEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('totalDebates', 'desc'),
          limit(50),
        );
        const snap = await getDocs(q);
        if (cancelled) return;

        const rows = snap.docs
          .map((d) => {
            const data = d.data() as UserProfile;
            const wins = (data.winsVsHuman ?? 0) + (data.winsVsAi ?? 0);
            const losses = (data.lossesVsHuman ?? 0) + (data.lossesVsAi ?? 0);
            const ties = (data.tiesVsHuman ?? 0) + (data.tiesVsAi ?? 0);
            const total = data.totalDebates ?? wins + losses + ties;
            const rate = total > 0 ? Math.round((wins / total) * 100) : 0;
            return {
              uid: d.id,
              name: data.nickname || '익명',
              wins,
              losses,
              total,
              rate,
            };
          })
          // Minimum 3 debates so a 1-0 user doesn't outrank a 12-3 user
          .filter((u) => u.total >= 3 && u.wins >= 1)
          .sort((a, b) => b.rate - a.rate || b.wins - a.wins)
          .slice(0, topN)
          .map<ChampionEntry>((u) => ({
            uid: u.uid,
            name: u.name,
            wins: u.wins,
            losses: u.losses,
            rate: u.rate,
          }));

        setChampions(rows.length > 0 ? rows : null);
      } catch (e) {
        // Non-fatal — fall back to placeholder
        console.warn('[useWeeklyChampions] fetch failed, using placeholder', e);
        if (!cancelled) setChampions(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [topN]);

  return { champions, loading };
}
