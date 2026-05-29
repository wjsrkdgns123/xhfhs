// #25 (incremental step 7): profile screen extracted from App.tsx.
import { lazy, Suspense, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { DEFAULT_AVATARS, type AvatarId, ProfileAvatar } from '../common';
import { LazyFallback, StatBox } from '../AppChrome';
import { showToast } from '../Toast';
import { commonStrings } from '../../i18n/common';
import { profileStrings } from '../../i18n/profile';
import type { Lang } from '../../i18n/landing';
import type { UserProfile } from '../../types';
import { resizeImageToDataUrl } from '../../lib/userText';
import { useProfileStats } from '../../hooks/useProfileStats';

const ProfileViewV2Lazy = lazy(() =>
  import('../ProfileViewV2').then((m) => ({ default: m.ProfileViewV2 })),
);

/** Wrapper around ProfileViewV2Lazy that fetches live Firestore data
 *  (history / ranking) via useProfileStats and derives badges + streak. */
function ProfileV2Stats({
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

export function ProfileView({
  user,
  profile,
  onBack,
  lang,
}: {
  user: User;
  profile: UserProfile | null;
  onBack: () => void;
  lang: Lang;
}) {
  const tProf = profileStrings[lang];
  const tCommon = commonStrings[lang];
  const [nickname, setNickname] = useState(profile?.nickname ?? user.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    setNickname(profile?.nickname ?? user.displayName ?? '');
  }, [profile?.nickname, user.displayName]);

  const setAvatarPreset = async (id: AvatarId) => {
    if (!db) return;
    setSavingAvatar(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        avatarId: id,
        avatarDataUrl: null,
      });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      showToast(`${lang === 'en' ? 'Avatar change failed' : '아바타 변경 실패'}: ${err.code ?? ''} ${err.message ?? ''}`, 'error');
    } finally {
      setSavingAvatar(false);
    }
  };

  const onUploadFile = async (file: File) => {
    if (!db) return;
    if (!file.type.startsWith('image/')) {
      showToast(lang === 'en' ? 'Only image files can be uploaded.' : '이미지 파일만 업로드 가능합니다.', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast(lang === 'en' ? 'File is too large (max 8MB).' : '파일이 너무 큽니다 (최대 8MB).', 'error');
      return;
    }
    setSavingAvatar(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 240, 0.85);
      // Firestore doc field max ~1MB. JPEG 240x240 q0.85 typically ~30-80KB.
      if (dataUrl.length > 900_000) {
        showToast(lang === 'en' ? 'The converted image is too large. Try a smaller one.' : '이미지 변환 결과가 너무 큽니다. 더 작은 이미지를 시도하세요.', 'error');
        return;
      }
      await updateDoc(doc(db, 'users', user.uid), {
        avatarDataUrl: dataUrl,
        avatarId: 'custom',
      });
    } catch (e: unknown) {
      const err = e as { message?: string };
      showToast(`${lang === 'en' ? 'Upload failed' : '업로드 실패'}: ${err.message ?? ''}`, 'error');
    } finally {
      setSavingAvatar(false);
    }
  };

  const save = async () => {
    if (!db) return;
    const trimmed = nickname.trim();
    if (!trimmed) {
      showToast(lang === 'en' ? 'Enter a nickname.' : '닉네임을 입력하세요.', 'error');
      return;
    }
    if (trimmed.length > 20) {
      showToast(lang === 'en' ? 'Nickname must be 20 characters or fewer.' : '닉네임은 20자 이내로 입력하세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { nickname: trimmed });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      showToast(`${lang === 'en' ? 'Save failed' : '저장 실패'}: ${err.code ?? ''} ${err.message ?? ''}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const winsHuman = profile?.winsVsHuman ?? 0;
  const lossesHuman = profile?.lossesVsHuman ?? 0;
  const tiesHuman = profile?.tiesVsHuman ?? 0;
  const winsAi = profile?.winsVsAi ?? 0;
  const lossesAi = profile?.lossesVsAi ?? 0;
  const tiesAi = profile?.tiesVsAi ?? 0;
  const wins = winsHuman + winsAi;
  const losses = lossesHuman + lossesAi;
  const ties = tiesHuman + tiesAi;
  const total = profile?.totalDebates ?? wins + losses + ties;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const totalHuman = winsHuman + lossesHuman + tiesHuman;
  const winRateHuman = totalHuman > 0 ? Math.round((winsHuman / totalHuman) * 100) : 0;
  const totalAi = winsAi + lossesAi + tiesAi;
  const winRateAi = totalAi > 0 ? Math.round((winsAi / totalAi) * 100) : 0;
  const dirty = (profile?.nickname ?? '') !== nickname.trim();

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="btn btn-ghost text-sm"
        style={{ padding: '4px 10px' }}
      >
        {lang === 'en' ? '← Lobby' : '← 로비로'}
      </button>

      {/* v2: editorial profile header + tabs (내 기록 / 뱃지 / 리그 순위).
          Live history/badges/ranking from Firestore via useProfileStats hook. */}
      {profile && (
        <Suspense fallback={<LazyFallback />}>
          <ProfileV2Stats profile={profile} uid={user.uid} totalDebates={total} />
        </Suspense>
      )}

      <section
        className="sketchy paper-grain p-3 sm:p-5 space-y-4"
        style={{ background: 'var(--color-paper-light)' }}
      >
        <h2 className="text-2xl font-bold m-0" style={{ color: 'var(--color-ink)' }}>
          <span
            className="inline-block px-2 -rotate-1"
            style={{ background: 'var(--color-vermillion)', color: 'var(--color-paper-light)' }}
          >
            {tProf.title}
          </span>
        </h2>

        <div className="flex items-center gap-4">
          <ProfileAvatar
            avatarId={profile?.avatarId as AvatarId | undefined}
            avatarDataUrl={profile?.avatarDataUrl}
            size={84}
          />
          <div className="flex-1">
            <label
              className="block text-xs mb-1"
              style={{ color: 'var(--color-ink-fade)' }}
            >
              {tProf.googleAccount}
            </label>
            <p className="text-sm m-0" style={{ color: 'var(--color-ink)' }}>
              {user.displayName ?? tCommon.common.anonymous} · {user.email ?? '—'}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
            {tProf.avatar.preset}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DEFAULT_AVATARS.map((a) => {
              const selected =
                !profile?.avatarDataUrl &&
                ((profile?.avatarId as AvatarId | undefined) ?? 'char1') === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAvatarPreset(a.id)}
                  disabled={savingAvatar}
                  className="card p-2 flex flex-col items-center gap-1"
                  style={{
                    background: selected ? 'var(--color-paper-deep)' : 'var(--color-paper-light)',
                    borderColor: selected ? 'var(--color-vermillion)' : 'var(--color-ink)',
                    borderWidth: selected ? 2 : 1.5,
                    cursor: savingAvatar ? 'wait' : 'pointer',
                  }}
                >
                  <ProfileAvatar avatarId={a.id} size={56} />
                  <div
                    className="font-bold"
                    style={{
                      fontSize: 12,
                      color: selected ? 'var(--color-vermillion)' : 'var(--color-ink)',
                    }}
                  >
                    {a.name}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--color-ink-fade)' }}>
                    {a.tagline}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <label
              className={savingAvatar ? 'btn opacity-50' : 'btn'}
              style={{ padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}
            >
              📷 사진 업로드
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={savingAvatar}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadFile(f);
                  e.target.value = '';
                }}
              />
            </label>
            {profile?.avatarDataUrl && (
              <button
                onClick={() => setAvatarPreset('char1')}
                disabled={savingAvatar}
                className="btn btn-ghost"
                style={{ padding: '6px 10px', fontSize: 12 }}
              >
                기본 캐릭터로 되돌리기
              </button>
            )}
            <span className="text-xs" style={{ color: 'var(--color-ink-fade)' }}>
              자동 240px 정사각형 변환
            </span>
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-bold mb-1"
            style={{ color: 'var(--color-ink)' }}
          >
            닉네임 (토론에서 표시되는 이름)
          </label>
          <div className="flex gap-2">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              placeholder="닉네임"
              className="input-paper flex-1"
            />
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="btn btn-pri"
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--color-ink-fade)' }}>
            최대 20자. 다음 토론부터 적용됩니다.
          </p>
        </div>
      </section>

      <section
        className="sketchy paper-grain p-3 sm:p-5"
        style={{ background: 'var(--color-paper-light)' }}
      >
        <h2 className="text-2xl font-bold mb-4 m-0" style={{ color: 'var(--color-ink)' }}>
          전적
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label="총 토론" value={total} />
          <StatBox label="승률" value={`${winRate}%`} />
          <StatBox label="승" value={wins} accent="pro" />
          <StatBox label="패" value={losses} accent="con" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div
            className="p-3"
            style={{
              border: '2px solid var(--color-celadon)',
              background: 'rgba(45, 74, 90, 0.08)',
              boxShadow: '2px 2px 0 var(--color-ink)',
            }}
          >
            <div className="font-bold mb-1" style={{ color: 'var(--color-celadon)' }}>
              👥 사람과 토론
            </div>
            <div style={{ color: 'var(--color-ink)' }}>
              {winsHuman}승 {lossesHuman}패{tiesHuman > 0 ? ` ${tiesHuman}무` : ''}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-ink-fade)' }}>
              승률 {winRateHuman}% · 총 {totalHuman}회
            </div>
          </div>
          <div
            className="p-3"
            style={{
              border: '2px solid var(--color-vermillion)',
              background: 'rgba(200, 75, 31, 0.08)',
              boxShadow: '2px 2px 0 var(--color-ink)',
            }}
          >
            <div className="font-bold mb-1" style={{ color: 'var(--color-vermillion)' }}>
              🤖 AI와 토론
            </div>
            <div style={{ color: 'var(--color-ink)' }}>
              {winsAi}승 {lossesAi}패{tiesAi > 0 ? ` ${tiesAi}무` : ''}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-ink-fade)' }}>
              승률 {winRateAi}% · 총 {totalAi}회
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
