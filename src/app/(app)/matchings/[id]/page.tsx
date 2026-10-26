'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { matchingApi, MatchingResponse } from '@/lib/api/matching';
import { getErrorMessage } from '@/lib/utils/errorHandler';

// 매칭 상태별 뱃지 설정
const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  PENDING: {
    label: '대기 중',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  PROCEED: {
    label: '진행 중',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  IN_PROGRESS: {
    label: '대화 중',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  HOLD: {
    label: '보류',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  CLOSED: {
    label: '종료',
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
};

// 매칭 상태별 안내 문구
const STATUS_DESCRIPTION: Record<string, string> = {
  PENDING: '상대방의 응답을 기다리고 있습니다.',
  PROCEED: '매칭이 성사되었습니다! 연락처를 교환해보세요.',
  IN_PROGRESS: '대화가 진행 중입니다.',
  HOLD: '매칭이 보류 상태입니다.',
  CLOSED: '매칭이 종료되었습니다.',
};

/**
 * 매칭 상세 페이지
 * 파트너 프로필 요약, 매칭 상태 뱃지, 액션 버튼(채팅/연락처 교환/매칭 진행·보류)
 */
export default function MatchingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const matchingId = Number(params.id);
  const showToast = useUIStore((state) => state.showToast);

  const [matching, setMatching] = useState<MatchingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);

  // 매칭 데이터 로드
  const fetchMatching = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await matchingApi.getMatching(matchingId);
      setMatching(data);
    } catch (err) {
      showToast(getErrorMessage(err));
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [matchingId, showToast, router]);

  useEffect(() => {
    if (matchingId) fetchMatching();
  }, [matchingId, fetchMatching]);

  // 매칭 진행 (PROCEED)
  const handleProceed = async () => {
    if (isActioning) return;
    setIsActioning(true);
    try {
      const updated = await matchingApi.updateMatchingStatus(matchingId, { status: 'PROCEED' });
      setMatching(updated);
      showToast('매칭을 진행합니다!');
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsActioning(false);
    }
  };

  // 매칭 보류 (HOLD)
  const handleHold = async () => {
    if (isActioning) return;
    setIsActioning(true);
    try {
      const updated = await matchingApi.updateMatchingStatus(matchingId, { status: 'HOLD' });
      setMatching(updated);
      showToast('매칭을 보류했습니다.');
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsActioning(false);
    }
  };

  // 연락처 교환
  const handleRevealContact = async () => {
    if (isActioning) return;
    setIsActioning(true);
    try {
      const updated = await matchingApi.revealContact(matchingId);
      setMatching(updated);
      showToast('연락처가 공개되었습니다!');
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsActioning(false);
    }
  };

  // 채팅하기 (플레이스홀더)
  const handleChat = () => {
    showToast('채팅 기능은 곧 지원됩니다');
  };

  // 로딩 화면
  if (isLoading || !matching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
        <p className="mt-4 text-sm text-subtext dark:text-[var(--subtext)]">매칭 정보를 불러오는 중...</p>
      </div>
    );
  }

  const partner = matching.partnerProfile;
  const badge = STATUS_BADGE[matching.status] || STATUS_BADGE.PENDING;
  const description = STATUS_DESCRIPTION[matching.status] || '';

  return (
    <div className="px-4 py-4 pb-28">
      {/* 상단 헤더: 뒤로가기 + 제목 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-ivory dark:hover:bg-dark-bg transition-colors"
          aria-label="뒤로가기"
        >
          <svg className="w-5 h-5 text-text dark:text-dark-cream" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text dark:text-dark-cream">매칭 상세</h1>
        <div className="w-10" /> {/* 가운데 정렬용 빈 공간 */}
      </div>

      {/* 매칭 상태 카드 */}
      <div className="mb-6 p-5 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          {/* 상태 뱃지 */}
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${badge.color}`}>
            {badge.label}
          </span>
          {/* 매칭일 */}
          <span className="text-xs text-subtext/60 dark:text-[var(--subtext)]/60">
            {new Date(matching.matchedAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
        <p className="text-sm text-subtext dark:text-[var(--subtext)] leading-relaxed">{description}</p>
      </div>

      {/* 파트너 프로필 요약 카드 */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-text dark:text-dark-cream mb-3 px-1">상대 프로필</h2>
        <button
          onClick={() => router.push(`/profiles/${partner.profileId}`)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40 transition-colors text-left"
        >
          {/* 프로필 사진 */}
          <div className="w-16 h-16 rounded-full overflow-hidden bg-ivory dark:bg-dark-bg border-2 border-gold/30 dark:border-dark-gold/30 flex-shrink-0">
            {partner.photoUrls && partner.photoUrls.length > 0 ? (
              <img
                src={partner.photoUrls[0]}
                alt={partner.nickname}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-subtext/30" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>

          {/* 프로필 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text dark:text-dark-cream truncate">
                {partner.nickname}
              </h3>
              {/* 인증 뱃지 */}
              {partner.verified && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-gold dark:bg-dark-gold text-white rounded-full flex-shrink-0">
                  인증
                </span>
              )}
            </div>
            <p className="text-sm text-subtext dark:text-[var(--subtext)] mt-0.5">
              {partner.age}세{partner.occupation ? ` | ${partner.occupation}` : ''}
            </p>
            {partner.location && (
              <p className="text-xs text-subtext/60 dark:text-[var(--subtext)]/60 mt-0.5">{partner.location}</p>
            )}
          </div>

          {/* 프로필 상세 화살표 */}
          <svg className="w-4 h-4 text-subtext/40 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* 연락처 정보 (교환 완료 시 표시) */}
      {matching.contactRevealed && matching.partnerContact && (
        <div className="mb-6 p-5 rounded-2xl bg-gold/5 dark:bg-dark-gold/5 border border-gold/20 dark:border-dark-gold/20">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gold dark:text-dark-gold" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            <h2 className="text-sm font-bold text-gold dark:text-dark-gold">연락처</h2>
          </div>
          <p className="text-base font-medium text-text dark:text-dark-cream">{matching.partnerContact}</p>
        </div>
      )}

      {/* 액션 버튼 영역 */}
      <div className="flex flex-col gap-3">

        {/* PENDING 상태: 매칭 진행 / 보류 */}
        {matching.status === 'PENDING' && (
          <div className="flex gap-3">
            <button
              onClick={handleHold}
              disabled={isActioning}
              className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-subtext dark:text-[var(--subtext)] text-sm font-medium hover:bg-ivory dark:hover:bg-dark-bg transition-colors disabled:opacity-50"
            >
              보류
            </button>
            <button
              onClick={handleProceed}
              disabled={isActioning}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold text-white text-sm font-bold shadow-lg shadow-gold/20 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              매칭 진행
            </button>
          </div>
        )}

        {/* HOLD 상태: 매칭 진행으로 변경 가능 */}
        {matching.status === 'HOLD' && (
          <button
            onClick={handleProceed}
            disabled={isActioning}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold text-white text-sm font-bold shadow-lg shadow-gold/20 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            매칭 진행
          </button>
        )}

        {/* PROCEED / IN_PROGRESS 상태: 연락처 교환 (아직 공개 안 된 경우) */}
        {(matching.status === 'PROCEED' || matching.status === 'IN_PROGRESS') && !matching.contactRevealed && (
          <button
            onClick={handleRevealContact}
            disabled={isActioning}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold text-white text-sm font-bold shadow-lg shadow-gold/20 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            연락처 교환하기
          </button>
        )}

        {/* PROCEED / IN_PROGRESS 상태: 보류로 변경 */}
        {(matching.status === 'PROCEED' || matching.status === 'IN_PROGRESS') && (
          <button
            onClick={handleHold}
            disabled={isActioning}
            className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-subtext dark:text-[var(--subtext)] text-sm font-medium hover:bg-ivory dark:hover:bg-dark-bg transition-colors disabled:opacity-50"
          >
            보류
          </button>
        )}

        {/* 종료(CLOSED) 아닌 모든 활성 상태: 채팅하기 */}
        {matching.status !== 'PENDING' && matching.status !== 'CLOSED' && (
          <button
            onClick={handleChat}
            className="w-full py-3.5 rounded-xl border border-gold dark:border-dark-gold text-gold dark:text-dark-gold text-sm font-medium hover:bg-gold/5 dark:hover:bg-dark-gold/5 transition-colors"
          >
            채팅하기
          </button>
        )}

        {/* CLOSED 상태: 안내 문구 */}
        {matching.status === 'CLOSED' && (
          <div className="text-center py-4">
            <p className="text-sm text-subtext dark:text-[var(--subtext)]">
              종료된 매칭입니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
