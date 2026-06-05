import { lazy } from 'react';
import { useProfileStats } from '../../hooks/useProfileStats';
import type { UserProfile } from '../../types';

const ProfileViewV2Lazy = lazy(() =>
  import('../ProfileViewV2').then((m) => ({ default: m.ProfileViewV2 })),
);

/** Wrapper around ProfileViewV2Lazy that fetches live Firestore data
 *  (history / ranking) via useProfileStats and derives badges + streak. */
export function ProfileV2Stats({
  uid,
  profile,
  totalDebates,
}: {
  uid: string;
  profile: UserProfile;
  totalDebates: number;
}) {
  const { history, badges, ranking, winStreak, last7 } = useProfileStats({
    uid,
    profile,
    historyLimit: 10,
    rankingLimit: 10,
  });
  return (
    <ProfileViewV2Lazy
      profile={profile}
      voice={profile.nickname ? `${profile.nickname}의 토론장` : '본질을 짚는 사람'}
      totalDebates={totalDebates}
      history={history}
      badges={badges}
      ranking={ranking}
      winStreak={winStreak}
      last7={last7}
    />
  );
}
