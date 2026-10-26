'use client';

// 남성 심사 카드 (여성 전용)
// 전체 프로필 표시 + 사진 슬라이더 + 별점 선택 + 투표 버튼

import { useState, useCallback } from 'react';
import VerificationBadge from '@/components/common/VerificationBadge';
import PercentileBadge from '@/components/common/PercentileBadge';

export interface ReviewProfileData {
  profileId: number;
  nickname: string;
  birthYear?: number;
  age: number;
  identityVerified?: boolean;
  locationCity?: string;
  occupation?: string;
  company?: string;
  bio?: string;
  photos: string[];
  percentileRank?: number;
  verifications: string[];
}

interface ReviewCardProps {
  profile: ReviewProfileData;
  onVote: (score: number) => void;
}

export default function ReviewCard({ profile, onVote }: ReviewCardProps) {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [selectedScore, setSelectedScore] = useState(0);
  const [hoveredScore, setHoveredScore] = useState(0);
  const [isVoting, setIsVoting] = useState(false);

  const photos = profile.photos.length > 0 ? profile.photos.slice(0, 3) : [];

  // 사진 슬라이더 이전/다음
  const goToPrevPhoto = useCallback(() => {
    setCurrentPhoto((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const goToNextPhoto = useCallback(() => {
    setCurrentPhoto((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  // 투표 처리
  const handleVote = async () => {
    if (selectedScore === 0 || isVoting) return;
    setIsVoting(true);
    try {
      onVote(selectedScore);
    } finally {
      setIsVoting(false);
    }
  };

  // 표시할 별점 (호버 우선, 선택된 값 차선)
  const displayScore = hoveredScore || selectedScore;

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white dark:bg-dark-card shadow-lg ring-1 ring-gray-100 dark:ring-gray-800">
      {/* 사진 슬라이더 영역 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {photos.length > 0 ? (
          <>
            {/* 현재 사진 */}
            <img
              src={photos[currentPhoto]}
              alt={`${profile.nickname}의 사진 ${currentPhoto + 1}`}
              className="h-full w-full object-cover"
            />

            {/* 이전/다음 네비게이션 (사진 2장 이상일 때) */}
            {photos.length > 1 && (
              <>
                {/* 이전 버튼 */}
                <button
                  type="button"
                  onClick={goToPrevPhoto}
                  aria-label="이전 사진"
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                </button>

                {/* 다음 버튼 */}
                <button
                  type="button"
                  onClick={goToNextPhoto}
                  aria-label="다음 사진"
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </button>

                {/* 사진 인디케이터 (하단 점) */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentPhoto(idx)}
                      aria-label={`사진 ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentPhoto
                          ? 'w-4 bg-white'
                          : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* 사진 위 그라데이션 */}
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/30 to-transparent" />
          </>
        ) : (
          // 사진 없을 때 플레이스홀더
          <div className="flex h-full w-full items-center justify-center">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300 dark:text-gray-600">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        )}

        {/* 퍼센타일 뱃지 (우상단) */}
        {profile.percentileRank != null && (
          <div className="absolute top-3 right-3">
            <PercentileBadge rank={profile.percentileRank} />
          </div>
        )}
      </div>

      {/* 프로필 정보 영역 */}
      <div className="p-5">
        {/* 닉네임 + 나이 */}
        <div className="flex items-baseline gap-2">
          <h3 className="text-lg font-semibold text-text dark:text-dark-cream">
            {profile.nickname}
          </h3>
          <span className="text-sm text-subtext dark:text-gray-400">
            {profile.age}세
          </span>
        </div>

        {/* 지역 + 직업/회사 */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtext dark:text-gray-400">
          {profile.locationCity && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {profile.locationCity}
            </span>
          )}
          {profile.occupation && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              {profile.occupation}
              {profile.company && ` @ ${profile.company}`}
            </span>
          )}
        </div>

        {/* 자기소개 */}
        {profile.bio && (
          <p className="mt-3 text-sm leading-relaxed text-text/80 dark:text-dark-cream/80 line-clamp-3">
            {profile.bio}
          </p>
        )}

        {/* 인증 뱃지 */}
        {profile.verifications.length > 0 && (
          <div className="mt-4">
            <VerificationBadge verifications={profile.verifications} />
          </div>
        )}

        {/* 구분선 */}
        <div className="my-5 flex items-center gap-2">
          <div className="h-px flex-1 bg-gold/15 dark:bg-dark-gold/15" />
          <span className="text-xs font-medium text-gold dark:text-dark-gold">심사</span>
          <div className="h-px flex-1 bg-gold/15 dark:bg-dark-gold/15" />
        </div>

        {/* 별점 선택 UI (1~5) */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setSelectedScore(score)}
                onMouseEnter={() => setHoveredScore(score)}
                onMouseLeave={() => setHoveredScore(0)}
                aria-label={`${score}점`}
                className="transition-transform duration-150 hover:scale-110 active:scale-95"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill={score <= displayScore ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className={`transition-colors ${
                    score <= displayScore
                      ? 'text-gold dark:text-dark-gold'
                      : 'text-gray-200 dark:text-gray-700'
                  }`}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>

          {/* 선택된 점수 표시 */}
          <span className="text-xs text-subtext dark:text-gray-400">
            {selectedScore > 0 ? `${selectedScore}점 선택됨` : '별점을 선택해 주세요'}
          </span>
        </div>

        {/* 투표 버튼 */}
        <button
          type="button"
          onClick={handleVote}
          disabled={selectedScore === 0 || isVoting}
          className="
            mt-4 w-full rounded-xl py-3 text-sm font-semibold
            transition-all duration-200
            bg-gradient-to-r from-gold to-rosegold
            dark:from-dark-gold dark:to-rosegold
            text-white
            shadow-md shadow-gold/20 dark:shadow-dark-gold/10
            hover:shadow-lg hover:shadow-gold/30
            active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-md
          "
        >
          {isVoting ? '투표 중...' : '투표하기'}
        </button>

        {/* 하트 보상 안내 */}
        <p className="mt-3 text-center text-xs text-subtext dark:text-gray-500">
          {/* 하트 아이콘 */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="inline-block mr-1 text-gold dark:text-dark-gold align-text-bottom"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          투표 참여 시 하트 1개가 보상으로 지급됩니다
        </p>
      </div>
    </div>
  );
}
