'use client';

// 프로필 카드 (호텔 키카드 스타일)
// 상단 사진 + 하단 정보 (닉네임, 나이, 지역, 인증 뱃지, 퍼센타일)

import { useRouter } from 'next/navigation';
import VerificationBadge from '@/components/common/VerificationBadge';
import PercentileBadge from '@/components/common/PercentileBadge';

export interface ProfileData {
  profileId: number;
  nickname: string;
  birthYear?: number;
  age: number;
  identityVerified?: boolean;
  locationCity?: string;
  photos: string[];
  percentileRank?: number;
  verifications: string[];
}

interface ProfileCardProps {
  profile: ProfileData;
  onClick?: () => void;
}

export default function ProfileCard({ profile, onClick }: ProfileCardProps) {
  const router = useRouter();
  const isTopTier = (profile.percentileRank ?? 100) <= 10;
  const mainPhoto = profile.photos[0];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/profiles/${profile.profileId}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        group relative w-full overflow-hidden rounded-2xl
        bg-white dark:bg-dark-card
        shadow-md hover:shadow-xl
        transition-all duration-300 hover:-translate-y-1
        text-left
        ${isTopTier ? 'ring-1 ring-gold/40 dark:ring-dark-gold/40' : 'ring-1 ring-gray-100 dark:ring-gray-800'}
      `}
    >
      {/* 상위 10% 이하: 골드 테두리 글로우 효과 */}
      {isTopTier && (
        <div className="absolute inset-0 z-0 rounded-2xl shadow-[inset_0_0_20px_rgba(184,134,11,0.08)] dark:shadow-[inset_0_0_20px_rgba(201,169,110,0.08)]" />
      )}

      {/* 상단: 프로필 사진 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-2xl bg-gray-100 dark:bg-gray-800">
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={`${profile.nickname}의 프로필 사진`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              // 이미지 로드 실패 시 플레이스홀더로 교체
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const parent = img.parentElement;
              if (parent && !parent.querySelector('.img-fallback')) {
                const fallback = document.createElement('div');
                fallback.className = 'img-fallback flex h-full w-full items-center justify-center';
                fallback.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-gray-300 dark:text-gray-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          // 사진 없을 때 플레이스홀더
          <div className="flex h-full w-full items-center justify-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-gray-300 dark:text-gray-600"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        )}

        {/* 사진 위 그라데이션 오버레이 (하단) */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />

        {/* 퍼센타일 뱃지 (사진 우상단) */}
        {profile.percentileRank != null && (
          <div className="absolute top-3 right-3">
            <PercentileBadge rank={profile.percentileRank} />
          </div>
        )}
      </div>

      {/* 하단: 프로필 정보 */}
      <div className="relative z-10 p-4">
        {/* 닉네임 + 나이 */}
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-semibold text-text dark:text-dark-cream truncate">
            {profile.nickname}
          </h3>
          <span className="shrink-0 text-sm text-subtext dark:text-gray-400">
            {profile.age}세
          </span>
        </div>

        {/* 지역 */}
        {profile.locationCity && (
          <p className="mt-1 flex items-center gap-1 text-xs text-subtext dark:text-gray-400">
            {/* 위치 핀 아이콘 */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {profile.locationCity}
          </p>
        )}

        {/* 인증 뱃지 */}
        {profile.verifications.length > 0 && (
          <div className="mt-3">
            <VerificationBadge verifications={profile.verifications} />
          </div>
        )}

        {/* 호텔 키카드 장식 라인 */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-gold/15 dark:bg-dark-gold/15" />
          <div className="h-1 w-1 rounded-full bg-gold/30 dark:bg-dark-gold/30" />
          <div className="h-px flex-1 bg-gold/15 dark:bg-dark-gold/15" />
        </div>
      </div>
    </button>
  );
}
