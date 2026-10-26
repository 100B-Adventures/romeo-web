'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { profileApi, ProfileDetailResponse } from '@/lib/api/profile';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import VerificationBadge from '@/components/common/VerificationBadge';
import PercentileBadge from '@/components/common/PercentileBadge';

/**
 * 내 프로필 관리 페이지
 * 프로필 사진, 닉네임, 상위% 뱃지, 인증 뱃지, 프로필 완성도, 메뉴 버튼
 */
export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);
  const [profile, setProfile] = useState<ProfileDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 프로필 데이터 로드
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await profileApi.getMyProfile();
      setProfile(data);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
        <p className="mt-4 text-sm text-subtext dark:text-[var(--subtext)]">프로필을 불러오는 중...</p>
      </div>
    );
  }

  // 프로필 완성도 계산
  const completeness = profile?.profileCompleteness ?? calculateCompleteness(profile);

  return (
    <div className="px-4 py-6">
      {/* 프로필 사진 + 기본 정보 */}
      <div className="flex flex-col items-center mb-8">
        {/* 큰 원형 프로필 사진 */}
        <div className="w-28 h-28 rounded-full overflow-hidden bg-ivory dark:bg-dark-bg border-3 border-gold dark:border-dark-gold mb-4 shadow-lg">
          {(profile?.photoUrls?.[0] || user?.profilePhoto) ? (
            <img
              src={profile?.photoUrls?.[0] || user?.profilePhoto}
              alt={profile?.nickname || user?.nickname}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-14 h-14 text-subtext/30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>

        {/* 닉네임 */}
        <h1 className="text-xl font-bold text-text dark:text-dark-cream mb-2">
          {profile?.nickname || user?.nickname || '닉네임 없음'}
        </h1>

        {/* 상위 % 뱃지 */}
        {(profile?.percentileRank || user?.percentileRank) && (
          <div className="mb-3">
            <PercentileBadge rank={profile?.percentileRank || user?.percentileRank || 0} />
          </div>
        )}

        {/* 인증 뱃지 5종 */}
        <div className="mb-4">
          <VerificationBadge verifications={profile?.verificationBadges || []} />
        </div>
      </div>

      {/* 프로필 완성도 프로그레스 바 */}
      <div className="mb-8 px-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text dark:text-dark-cream">프로필 완성도</span>
          <span className="text-sm font-bold text-gold dark:text-dark-gold">{completeness}%</span>
        </div>
        <div className="w-full h-2.5 bg-ivory dark:bg-dark-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold rounded-full transition-all duration-500"
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 80 && (
          <p className="text-xs text-subtext dark:text-[var(--subtext)] mt-2">
            프로필을 더 채워주시면 매칭 확률이 올라갑니다!
          </p>
        )}
      </div>

      {/* 메뉴 버튼 목록 */}
      <div className="flex flex-col gap-3">
        <MenuButton
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          }
          label="프로필 수정"
          description="사진, 자기소개, 기본 정보 편집"
          onClick={() => router.push('/profile/edit')}
        />

        <MenuButton
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          }
          label="인증 관리"
          description="신원, 학력, 소득, 직업, 거주지 인증"
          onClick={() => router.push('/profile/verification')}
          badge={`${Math.min(new Set(profile?.verificationBadges || []).size, 5)}/5`}
        />

        <MenuButton
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          }
          label="선호도 설정"
          description="원하는 상대의 조건을 설정"
          onClick={() => router.push('/profile/preferences')}
        />

        <MenuButton
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          label="설정"
          description="알림, 계정, 개인정보 관리"
          onClick={() => router.push('/profile/settings')}
        />
      </div>
    </div>
  );
}

/** 메뉴 버튼 컴포넌트 */
function MenuButton({
  icon,
  label,
  description,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40 transition-colors text-left"
    >
      <span className="text-gold dark:text-dark-gold flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-text dark:text-dark-cream">{label}</h3>
        <p className="text-xs text-subtext dark:text-[var(--subtext)] mt-0.5">{description}</p>
      </div>
      {badge && (
        <span className="px-2 py-0.5 text-[10px] font-bold bg-gold/10 dark:bg-dark-gold/10 text-gold dark:text-dark-gold rounded-full">
          {badge}
        </span>
      )}
      <svg className="w-4 h-4 text-subtext/40 dark:text-[var(--subtext)]/40 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  );
}

/** 프로필 완성도 계산 (클라이언트 폴백) */
function calculateCompleteness(profile: ProfileDetailResponse | null): number {
  if (!profile) return 0;
  const fields = [
    profile.nickname,
    profile.birthYear,
    profile.location,
    profile.height,
    profile.bodyType,
    profile.religion,
    profile.smoking,
    profile.drinking,
    profile.occupation,
    profile.bio,
    profile.personalities?.length,
    profile.hobbies?.length,
    (profile.photoUrls?.length ?? 0) >= 3,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}
