'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// FAQ 항목 인터페이스
interface FaqItem {
  question: string;
  answer: string;
}

// FAQ 데이터
const FAQ_ITEMS: FaqItem[] = [
  {
    question: '매칭은 어떻게 이루어지나요?',
    answer:
      '매일 정오(KST 12:00)에 엄선된 한 분을 추천합니다. 양쪽 모두 관심을 표현하면 매칭이 성사되며, 24시간 내에 응답하지 않으면 자동으로 만료됩니다.',
  },
  {
    question: '하트는 어떻게 사용하나요?',
    answer:
      '하트는 상대에게 관심을 표현할 때 사용됩니다. OK(일반 좋아요)에는 하트가 소모되며, Super OK(특별 좋아요)에는 더 많은 하트가 필요합니다. 하트는 스토어에서 충전할 수 있습니다.',
  },
  {
    question: 'Cupid 추천은 어떻게 이루어지나요?',
    answer:
      'Cupid AI가 매일 정오(KST 12:00) 단 한 분을 큐레이션하여 추천합니다. 인증 4종(학력·직장·자산·소득)과 라이프스타일 8축을 종합하여 매칭 점수를 산정하며, 매칭 이유 한 줄을 함께 제공합니다.',
  },
  {
    question: '프로필 인증은 어떤 종류가 있나요?',
    answer:
      '신원 인증, 학력 인증, 소득 인증, 직장 인증, 거주지 인증 총 5종의 인증을 제공합니다. 인증이 많을수록 프로필 신뢰도가 높아지고, 매칭 우선순위에서 유리합니다.',
  },
  {
    question: '결제 후 환불이 가능한가요?',
    answer:
      '미사용 하트에 한해 구매 후 7일 이내 환불이 가능합니다. 이미 사용한 하트는 환불 대상에서 제외됩니다. 환불 요청은 고객센터 이메일로 연락해주세요.',
  },
  {
    question: '아는 사람을 만나고 싶지 않아요.',
    answer:
      '설정 > 아는사람 피하기 기능을 이용하시면 연락처에 등록된 지인을 추천에서 제외할 수 있습니다. 또한 특정 사용자를 차단하면 서로의 프로필이 노출되지 않습니다.',
  },
];

/**
 * 고객센터 페이지
 * FAQ 아코디언 + 문의하기 + 약관 링크
 */
export default function SupportPage() {
  const router = useRouter();

  // 열려 있는 FAQ 인덱스 (복수 허용)
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

  // FAQ 토글 핸들러
  const toggleFaq = (index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
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
        <h1 className="text-lg font-bold text-text dark:text-dark-cream">고객센터</h1>
      </div>

      {/* 안내 배너 */}
      <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-gold/10 to-rosegold/10 dark:from-dark-gold/10 dark:to-rosegold/10 border border-gold/20 dark:border-dark-gold/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/20 to-rosegold/20 dark:from-dark-gold/20 dark:to-rosegold/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-gold dark:text-dark-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-text dark:text-dark-cream">무엇을 도와드릴까요?</h2>
            <p className="text-xs text-subtext dark:text-[var(--subtext)] mt-0.5">
              자주 묻는 질문을 확인하시거나 문의해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ 섹션 */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-subtext dark:text-[var(--subtext)] uppercase tracking-wider mb-3 px-1">
          자주 묻는 질문
        </h3>

        <div className="rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
          {FAQ_ITEMS.map((faq, index) => {
            const isOpen = openIndices.has(index);
            return (
              <div key={index}>
                {/* 질문 버튼 */}
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-ivory/50 dark:hover:bg-dark-bg/50 transition-colors"
                >
                  <span className="text-sm font-medium text-text dark:text-dark-cream pr-3 leading-relaxed">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-4 h-4 text-subtext dark:text-[var(--subtext)] flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* 답변 (아코디언) */}
                {isOpen && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-subtext dark:text-[var(--subtext)] leading-relaxed bg-ivory dark:bg-dark-bg rounded-xl p-3">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 문의하기 섹션 */}
      <div className="mb-6 p-5 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]">
        <h3 className="text-sm font-bold text-text dark:text-dark-cream mb-3">문의하기</h3>
        <p className="text-xs text-subtext dark:text-[var(--subtext)] leading-relaxed mb-4">
          FAQ에서 답변을 찾지 못하셨나요?<br />
          아래 이메일로 문의해주시면 영업일 기준 1~2일 내 답변드립니다.
        </p>

        <a
          href="mailto:support@romeoncupid.art"
          className="flex items-center gap-3 p-4 rounded-xl bg-ivory dark:bg-dark-bg border border-gold/20 dark:border-dark-gold/20 hover:border-gold/40 dark:hover:border-dark-gold/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gold/10 dark:bg-dark-gold/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gold dark:text-dark-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-text dark:text-dark-cream">이메일 문의</p>
            <p className="text-xs text-gold dark:text-dark-gold mt-0.5">support@romeoncupid.art</p>
          </div>
          <svg className="w-4 h-4 text-subtext/40 dark:text-[var(--subtext)]/40 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </a>
      </div>

      {/* 약관 링크 */}
      <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]">
        <h3 className="text-sm font-bold text-text dark:text-dark-cream mb-3">약관 및 정책</h3>

        <div className="flex flex-col divide-y divide-[var(--border)]">
          <a
            href="https://romeoncupid.art/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-3 hover:opacity-80 transition-opacity"
          >
            <span className="text-sm text-text dark:text-dark-cream">서비스 이용약관</span>
            <svg className="w-4 h-4 text-subtext/40 dark:text-[var(--subtext)]/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>

          <a
            href="https://romeoncupid.art/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-3 hover:opacity-80 transition-opacity"
          >
            <span className="text-sm text-text dark:text-dark-cream">개인정보처리방침</span>
            <svg className="w-4 h-4 text-subtext/40 dark:text-[var(--subtext)]/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>

          <a
            href="https://romeoncupid.art/marketing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-3 hover:opacity-80 transition-opacity"
          >
            <span className="text-sm text-text dark:text-dark-cream">마케팅 정보 수신 동의</span>
            <svg className="w-4 h-4 text-subtext/40 dark:text-[var(--subtext)]/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-8" />
    </div>
  );
}
