'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import apiClient from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/errorHandler';

// 커플 정보 인터페이스
interface CoupleInfo {
  id: number;
  matchingId: number;
  partnerNickname: string;
  partnerProfilePhoto?: string;
  message?: string;
  status: 'REGISTERED' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
}

/**
 * 커플 소식 페이지
 * 커플 등록 폼 + 내 커플 상태 표시
 */
export default function CouplePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);

  // 폼 상태
  const [matchingId, setMatchingId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 커플 정보 상태
  const [coupleInfo, setCoupleInfo] = useState<CoupleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCouple, setHasCouple] = useState(false);

  // 내 커플 정보 조회
  const fetchCoupleInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/couples/my');
      const data = response.data?.data || response.data;
      if (data) {
        setCoupleInfo(data);
        setHasCouple(true);
      }
    } catch {
      // 커플 정보가 없는 경우 (정상)
      setHasCouple(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupleInfo();
  }, [fetchCoupleInfo]);

  // 커플 등록 핸들러
  const handleSubmit = async () => {
    if (!matchingId.trim()) {
      showToast('매칭 ID를 입력해주세요.');
      return;
    }

    const parsedId = parseInt(matchingId.trim(), 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      showToast('올바른 매칭 ID를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/couples', {
        matchingId: parsedId,
        message: message.trim() || null,
      });
      showToast('커플 등록이 완료되었습니다!');
      setMatchingId('');
      setMessage('');
      // 등록 후 커플 정보 다시 조회
      await fetchCoupleInfo();
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 로딩
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
        <p className="mt-4 text-sm text-subtext dark:text-[var(--subtext)]">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-dark-card border border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40 transition-colors"
          aria-label="뒤로가기"
        >
          <svg className="w-5 h-5 text-text dark:text-dark-cream" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text dark:text-dark-cream">커플 소식</h1>
      </div>

      {/* 커플 등록 배너 */}
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-gold/10 to-rosegold/10 dark:from-dark-gold/10 dark:to-rosegold/10 border border-gold/20 dark:border-dark-gold/20 text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-gold/20 to-rosegold/20 dark:from-dark-gold/20 dark:to-rosegold/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-gold dark:text-dark-gold" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-text dark:text-dark-cream mb-1">
          소중한 인연을 이루셨나요?
        </h2>
        <p className="text-xs text-subtext dark:text-[var(--subtext)] leading-relaxed">
          Romeo & Cupid에서 만난 소중한 인연을 등록하고<br />
          여러분의 이야기를 공유해주세요.
        </p>
      </div>

      {/* 내 커플 상태 */}
      {hasCouple && coupleInfo && (
        <div className="mb-6 p-5 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h3 className="text-sm font-bold text-text dark:text-dark-cream">내 커플 등록 현황</h3>
          </div>

          <div className="flex items-center gap-4 mb-4">
            {/* 내 프로필 */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-ivory dark:bg-dark-bg border-2 border-gold dark:border-dark-gold">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="나" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-subtext dark:text-dark-cream" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-subtext dark:text-[var(--subtext)]">나</span>
            </div>

            {/* 하트 연결 아이콘 */}
            <div className="flex-1 flex justify-center">
              <svg className="w-6 h-6 text-gold dark:text-dark-gold" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>

            {/* 파트너 프로필 */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-ivory dark:bg-dark-bg border-2 border-rosegold dark:border-rosegold">
                {coupleInfo.partnerProfilePhoto ? (
                  <img src={coupleInfo.partnerProfilePhoto} alt="파트너" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-subtext dark:text-dark-cream" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-subtext dark:text-[var(--subtext)]">{coupleInfo.partnerNickname}</span>
            </div>
          </div>

          {/* 커플 메시지 */}
          {coupleInfo.message && (
            <div className="mb-3 p-3 rounded-xl bg-ivory dark:bg-dark-bg">
              <p className="text-xs text-text dark:text-dark-cream italic leading-relaxed">
                &ldquo;{coupleInfo.message}&rdquo;
              </p>
            </div>
          )}

          {/* 등록일 */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-subtext dark:text-[var(--subtext)]">
              등록일: {formatDate(coupleInfo.createdAt)}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
              coupleInfo.status === 'CONFIRMED'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                : coupleInfo.status === 'REGISTERED'
                ? 'bg-gold/10 dark:bg-dark-gold/10 text-gold dark:text-dark-gold'
                : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
            }`}>
              {coupleInfo.status === 'CONFIRMED' ? '확인됨' : coupleInfo.status === 'REGISTERED' ? '대기 중' : '취소됨'}
            </span>
          </div>
        </div>
      )}

      {/* 커플 등록 폼 */}
      {!hasCouple && (
        <div className="mb-6 p-5 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]">
          <h3 className="text-sm font-bold text-text dark:text-dark-cream mb-4">커플 등록하기</h3>

          {/* 매칭 ID 입력 */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-subtext dark:text-[var(--subtext)] mb-1.5">
              매칭 ID
            </label>
            <input
              type="number"
              value={matchingId}
              onChange={(e) => setMatchingId(e.target.value)}
              placeholder="매칭 상세에서 매칭 ID를 확인해주세요"
              className="w-full px-4 py-3 rounded-xl bg-ivory dark:bg-dark-bg border border-[var(--border)] focus:border-gold dark:focus:border-dark-gold focus:outline-none text-sm text-text dark:text-dark-cream placeholder-subtext/40"
            />
          </div>

          {/* 파트너에게 보내는 메시지 */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-subtext dark:text-[var(--subtext)] mb-1.5">
              파트너에게 보내는 메시지 <span className="text-subtext/40">(선택)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="소중한 인연에게 한마디를 남겨보세요"
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-ivory dark:bg-dark-bg border border-[var(--border)] focus:border-gold dark:focus:border-dark-gold focus:outline-none text-sm text-text dark:text-dark-cream placeholder-subtext/40 resize-none"
            />
            <p className="text-right text-[10px] text-subtext/40 dark:text-[var(--subtext)]/40 mt-1">
              {message.length}/200
            </p>
          </div>

          {/* 등록 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !matchingId.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold text-white font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-gold/20"
          >
            {isSubmitting ? '등록 중...' : '커플 등록하기'}
          </button>
        </div>
      )}

      {/* 성공 스토리 */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-text dark:text-dark-cream mb-3">Romeo & Cupid 성공 스토리</h3>
        <div className="flex flex-col gap-3">
          {[
            { names: 'J님 & S님', period: '2025년 11월 매칭', message: '처음엔 반신반의했지만, 인증 4종이 박힌 분이라 믿음이 갔어요. 지금은 매일 행복합니다.', tag: '교제 중' },
            { names: 'M님 & K님', period: '2025년 9월 매칭', message: '서로의 진심을 확인하고 결혼을 약속했습니다. Cupid 매거진 큐레이션으로 만난 인연이라 더 특별해요.', tag: '결혼 예정' },
            { names: 'H님 & Y님', period: '2025년 12월 매칭', message: '매거진처럼 정중한 첫 만남이 아직도 생생해요. 좋은 사람 만나게 해주셔서 감사합니다.', tag: '교제 중' },
          ].map((story, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/20 to-rosegold/20 dark:from-dark-gold/20 dark:to-rosegold/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gold dark:text-dark-gold" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text dark:text-dark-cream">{story.names}</p>
                    <p className="text-[10px] text-subtext dark:text-[var(--subtext)]">{story.period}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gold/10 dark:bg-dark-gold/10 text-gold dark:text-dark-gold">
                  {story.tag}
                </span>
              </div>
              <p className="text-xs text-subtext dark:text-[var(--subtext)] leading-relaxed italic">
                &ldquo;{story.message}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 이용 안내 */}
      {!hasCouple && (
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]">
          <h3 className="text-sm font-bold text-text dark:text-dark-cream mb-3">이용 안내</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gold/10 dark:bg-dark-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-gold dark:text-dark-gold">1</span>
              </div>
              <p className="text-xs text-subtext dark:text-[var(--subtext)] leading-relaxed">
                매칭이 성사된 후, 매칭 상세 페이지에서 매칭 ID를 확인하세요.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gold/10 dark:bg-dark-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-gold dark:text-dark-gold">2</span>
              </div>
              <p className="text-xs text-subtext dark:text-[var(--subtext)] leading-relaxed">
                매칭 ID를 입력하고 커플 등록을 완료하세요.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gold/10 dark:bg-dark-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-gold dark:text-dark-gold">3</span>
              </div>
              <p className="text-xs text-subtext dark:text-[var(--subtext)] leading-relaxed">
                파트너가 확인하면 커플 등록이 완료됩니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
