'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

/**
 * 친구 초대 페이지
 * 초대 코드 표시, 링크 복사, 초대 혜택 설명, 초대 현황
 */
export default function InvitePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);

  const [isCopied, setIsCopied] = useState(false);

  // 사용자 ID 기반 초대 코드 생성
  const inviteCode = useMemo(() => {
    if (!user?.userId) return 'ROMEO000';
    // 간단한 코드 생성: ROMEO + userId를 6자리 패딩
    return `ROMEO${String(user.userId).padStart(6, '0')}`;
  }, [user?.userId]);

  // 초대 링크
  const inviteLink = useMemo(() => {
    return `https://romeoncupid.art/invite?code=${inviteCode}`;
  }, [inviteCode]);

  // 링크 복사 핸들러
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setIsCopied(true);
      showToast('초대 링크가 복사되었습니다.');
      // 3초 후 복사 상태 초기화
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      showToast('링크 복사에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 코드 복사 핸들러
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      showToast('초대 코드가 복사되었습니다.');
    } catch {
      showToast('코드 복사에 실패했습니다.');
    }
  };

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
        <h1 className="text-lg font-bold text-text dark:text-dark-cream">친구 초대</h1>
      </div>

      {/* 초대 히어로 배너 */}
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-gold/10 to-rosegold/10 dark:from-dark-gold/10 dark:to-rosegold/10 border border-gold/20 dark:border-dark-gold/20 text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-gold/20 to-rosegold/20 dark:from-dark-gold/20 dark:to-rosegold/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-gold dark:text-dark-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-text dark:text-dark-cream mb-1">
          친구에게 Cupid를 소개해 보세요
        </h2>
        <p className="text-xs text-subtext dark:text-[var(--subtext)] leading-relaxed">
          초대한 친구가 가입하면<br />
          초대 코드를 공유하면 친구가 Cupid를 바로 시작할 수 있어요.</p>
      </div>

      {/* 초대 코드 카드 */}
      <div className="mb-4 p-5 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]">
        <h3 className="text-xs font-semibold text-subtext dark:text-[var(--subtext)] uppercase tracking-wider mb-3">
          내 초대 코드
        </h3>

        {/* 초대 코드 표시 */}
        <div className="flex items-center justify-between p-4 mb-4 rounded-xl bg-ivory dark:bg-dark-bg border border-gold/20 dark:border-dark-gold/20">
          <span className="text-xl font-bold text-gold dark:text-dark-gold tracking-widest">
            {inviteCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-lg bg-gold/10 dark:bg-dark-gold/10 text-gold dark:text-dark-gold text-xs font-medium hover:bg-gold/20 dark:hover:bg-dark-gold/20 transition-colors"
          >
            복사
          </button>
        </div>

        {/* 링크 복사 버튼 */}
        <button
          onClick={handleCopyLink}
          className={`w-full py-3.5 rounded-xl font-bold text-base transition-all active:scale-[0.98] shadow-lg ${
            isCopied
              ? 'bg-green-500 text-white shadow-green-500/20'
              : 'bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold text-white shadow-gold/20'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            {isCopied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                복사 완료!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.556a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L5.25 9.879" />
                </svg>
                초대 링크 복사하기
              </>
            )}
          </span>
        </button>
      </div>

      {/* 초대 보상은 아직 지급 경로가 없다. 서버에 초대·추천 코드가 한 줄도 없고
          가입 경로에 코드 입력란도 없다(2026-09-11 실측). 예전에는 이 자리에
          "하트 5개 지급", "10명 초대 시 프리미엄 1주 무료" 라고 적혀 있었는데
          받을 방법이 없는 약속이었고 프리미엄이라는 상품 자체도 없다.
          보상을 실제로 붙일 때 이 자리를 되살린다. */}

      {/* 초대 현황 집계는 서버가 세지 않는다. 예전에는 총 초대·가입 완료 자리에
          숫자 0 이 코드에 박혀 있었고, 회원 눈에는 실제로 센 결과처럼 보였다.
          세는 기능이 붙을 때 이 자리를 되살린다. (2026-09-11) */}
    </div>
  );
}
