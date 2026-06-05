import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Side, UserProfile, Room } from '../types';

export interface HistoryEntry {
  topic: string;
  side: Side;
  result: 'win' | 'lose' | 'tie';
  score: string;
  date: string;
  voice?: string;
}

export interface RankEntry {
  rank: number;
  name: string;
  delta: string;
  wins: number;
  rate: number;
  mine?: boolean;
}

export interface Badge {
  name: string;
  desc: string;
  color: 'gold' | 'vermillion' | 'celadon' | 'ink';
  earned: boolean;
}

/** Format unix millis as MM.DD (zero-padded). */
function fmtDate(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** Compute per-user win rate from UserProfile aggregate fields. */
function computeWinRate(p: Pick<UserProfile, 'winsVsHuman' | 'winsVsAi' | 'lossesVsHuman' | 'lossesVsAi' | 'tiesVsHuman' | 'tiesVsAi' | 'totalDebates'>): { wins: number; total: number; rate: number } {
  const wins = (p.winsVsHuman ?? 0) + (p.winsVsAi ?? 0);
  const losses = (p.lossesVsHuman ?? 0) + (p.lossesVsAi ?? 0);
  const ties = (p.tiesVsHuman ?? 0) + (p.tiesVsAi ?? 0);
  const total = p.totalDebates ?? wins + losses + ties;
  const rate = total > 0 ? Math.round((wins / total) * 100) : 0;
  return { wins, total, rate };
}

/** Derive a badge set from UserProfile aggregates.
 *  Pure derivation — no Firestore needed. */
function computeBadges(profile: UserProfile, history: HistoryEntry[]): Badge[] {
  const { wins, total, rate } = computeWinRate(profile);
  const lossesVsHuman = profile.lossesVsHuman ?? 0;
  const winsVsAi = profile.winsVsAi ?? 0;
  const winsVsHuman = profile.winsVsHuman ?? 0;

  // Compute current win streak from history (most recent first)
  let streak = 0;
  for (const h of history) {
    if (h.result === 'win') streak++;
    else break;
  }

  return [
    {
      name: '첫 발언',
      desc: '첫 번째 토론을 마쳤다',
      color: 'gold',
      earned: total >= 1,
    },
    {
      name: '5전 베테랑',
      desc: '5번의 토론을 경험했다',
      color: 'gold',
      earned: total >= 5,
    },
    {
      name: '10승 달성',
      desc: '누적 10승',
      color: 'vermillion',
      earned: wins >= 10,
    },
    {
      name: 'AI 정복자',
      desc: 'AI 상대로 5승 이상',
      color: 'celadon',
      earned: winsVsAi >= 5,
    },
    {
      name: '인간 정복자',
      desc: '사람 상대로 5승 이상',
      color: 'vermillion',
      earned: winsVsHuman >= 5,
    },
    {
      name: '연승 4',
      desc: '4회 연속 승리',
      color: 'gold',
      earned: streak >= 4,
    },
    {
      name: '승률의 신',
      desc: '10전 이상 승률 80% 이상',
      color: 'vermillion',
      earned: total >= 10 && rate >= 80,
    },
    {
      name: '백전노장',
      desc: '100전 달성',
      color: 'ink',
      earned: total >= 100,
    },
    {
      name: '오뚝이',
      desc: '5패 이후에도 토론을 이어가는 사람',
      color: 'celadon',
      earned: lossesVsHuman >= 5 && total >= 10,
    },
  ];
}

interface UseProfileStatsOpts {
  uid: string | null;
  profile: UserProfile | null;
  /** Limit on history rows. Defaults to 10. */
  historyLimit?: number;
  /** Limit on ranking entries. Defaults to 10. */
  rankingLimit?: number;
}

interface UseProfileStatsResult {
  history: HistoryEntry[];
  badges: Badge[];
  ranking: RankEntry[];
  winStreak: number;
  last7: ('win' | 'lose' | 'tie')[];
  loading: boolean;
  error?: string;
}

/** Fetch ProfileViewV2 props (history / ranking) for a given user.
 *  Badges + winStreak + last7 are derived from history and the
 *  UserProfile aggregates — no extra Firestore round-trips. */
export function useProfileStats({
  uid,
  profile,
  historyLimit = 10,
  rankingLimit = 10,
}: UseProfileStatsOpts): UseProfileStatsResult {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!db || !uid) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Two queries needed because Firestore doesn't support OR across fields.
        // Limit each side so the worst case is 2 * historyLimit docs.
        const asProQ = query(
          collection(db, 'rooms'),
          where('proUid', '==', uid),
          where('status', '==', 'ended'),
          orderBy('createdAt', 'desc'),
          limit(historyLimit),
        );
        const asConQ = query(
          collection(db, 'rooms'),
          where('conUid', '==', uid),
          where('status', '==', 'ended'),
          orderBy('createdAt', 'desc'),
          limit(historyLimit),
        );

        const [asProSnap, asConSnap] = await Promise.all([
          getDocs(asProQ),
          getDocs(asConQ),
        ]);
        if (cancelled) return;

        const built: { entry: HistoryEntry; ts: number }[] = [];
        const seen = new Set<string>();
        for (const d of [...asProSnap.docs, ...asConSnap.docs]) {
          if (seen.has(d.id)) continue;
          seen.add(d.id);
          const r = { id: d.id, ...(d.data() as Omit<Room, 'id'>) };
          const mySide: Side = r.proUid === uid ? 'pro' : 'con';
          const result: 'win' | 'lose' | 'tie' =
            r.winner === mySide ? 'win' : r.winner === 'tie' || !r.winner ? 'tie' : 'lose';
          const proScore = typeof r.finalProScore === 'number' ? r.finalProScore : 50;
          const conScore = 100 - proScore;
          const myScore = mySide === 'pro' ? proScore : conScore;
          const oppScore = mySide === 'pro' ? conScore : proScore;
          built.push({
            entry: {
              topic: r.topic,
              side: mySide,
              result,
              score: `${myScore}:${oppScore}`,
              date: fmtDate(r.createdAt),
            },
            ts: r.createdAt,
          });
        }
        // 숫자 타임스탬프로 정렬한다. MM.DD 문자열 정렬은 12월("12.xx")과
        // 1월("01.xx")이 섞이면 순서가 뒤집혀 winStreak/last7이 어긋난다.
        built.sort((a, b) => b.ts - a.ts);
        setHistory(built.slice(0, historyLimit).map((b) => b.entry));
      } catch (e) {
        const err = e as { code?: string; message?: string };
        console.error('[useProfileStats] history fetch failed', err);
        if (!cancelled) setError(err.message ?? '히스토리 조회 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, historyLimit]);

  useEffect(() => {
    if (!db) return;
    let cancelled = false;

    (async () => {
      try {
        // Top users by totalDebates — client-side sort by computed win rate
        // since Firestore doesn't have a computed-field index.
        const usersQ = query(
          collection(db, 'users'),
          orderBy('totalDebates', 'desc'),
          limit(50),
        );
        const snap = await getDocs(usersQ);
        if (cancelled) return;

        const rows = snap.docs
          .map((d) => {
            const data = d.data() as UserProfile;
            const { wins, total, rate } = computeWinRate(data);
            return {
              uid: d.id,
              name: data.nickname || '익명',
              wins,
              total,
              rate,
            };
          })
          .filter((u) => u.total >= 3) // 너무 적은 표본 제외
          .sort((a, b) => b.rate - a.rate || b.wins - a.wins)
          .slice(0, rankingLimit)
          .map<RankEntry>((u, i) => ({
            rank: i + 1,
            name: u.name,
            delta: '·', // delta tracking 미구현 — placeholder
            wins: u.wins,
            rate: u.rate,
            mine: u.uid === uid,
          }));

        setRanking(rows);
      } catch (e) {
        const err = e as { code?: string; message?: string };
        console.error('[useProfileStats] ranking fetch failed', err);
        // 비치명적 — 빈 ranking으로 진행
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, rankingLimit]);

  const winStreak = useMemo(() => {
    let s = 0;
    for (const h of history) {
      if (h.result === 'win') s++;
      else break;
    }
    return s;
  }, [history]);

  const last7 = useMemo(
    () => history.slice(0, 7).map((h) => h.result),
    [history],
  );

  const badges = useMemo(() => (profile ? computeBadges(profile, history) : []), [profile, history]);

  return { history, badges, ranking, winStreak, last7, loading, error };
}
