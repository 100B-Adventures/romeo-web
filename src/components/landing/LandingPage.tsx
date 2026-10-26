'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { showcaseApi, ShowcaseProfile } from '@/lib/api/showcase';

/**
 * 랜딩 페이지 — Editorial 매거진 톤 (R21 Cupid pivot)
 * 히어로 → Cupid 매거진 큐레이션 소개 → 성공 통계 → 쇼케이스 → CTA
 */
export default function LandingPage() {
  const router = useRouter();
  const [showcaseProfiles, setShowcaseProfiles] = useState<ShowcaseProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 쇼케이스 프로필 로드
  useEffect(() => {
    const fetchShowcase = async () => {
      try {
        const profiles = await showcaseApi.getProfiles();
        setShowcaseProfiles(profiles);
      } catch (error) {
        console.error('[Landing] 쇼케이스 프로필 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShowcase();
  }, []);

  return (
    <div className="min-h-screen bg-ivory dark:bg-dark-bg">
      {/* 네비게이션 바 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-ivory/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16 px-6">
          <span className="text-xl font-bold tracking-tight text-gold dark:text-dark-gold">
            Romeo & Cupid
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm font-medium text-text dark:text-dark-cream hover:text-gold dark:hover:text-dark-gold transition-colors"
            >
              로그인
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="px-5 py-2 text-sm font-semibold text-white bg-gold dark:bg-dark-gold rounded-full hover:opacity-90 transition-opacity"
            >
              시작하기
            </button>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 — 5성급 호텔 로비 감성 */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* 장식용 골드 라인 */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-transparent via-gold/40 to-transparent" />

        <div className="max-w-3xl mx-auto text-center">
          {/* 서브 헤드라인 */}
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gold dark:text-dark-gold mb-8">
            Exclusive Premium Matching
          </p>

          {/* 메인 헤드라인 — 명품 브랜드 감성 */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.2] text-text dark:text-dark-cream mb-4">
            <span className="text-gold dark:text-dark-gold italic">스쳐 지나갈</span> 인연은
            <br />
            소개하지 않습니다
          </h1>

          {/* 골드 구분선 */}
          <div className="flex items-center justify-center gap-3 my-8">
            <div className="w-12 h-px bg-gold/30 dark:bg-dark-gold/30" />
            <svg className="w-4 h-4 text-gold dark:text-dark-gold" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <div className="w-12 h-px bg-gold/30 dark:bg-dark-gold/30" />
          </div>

          {/* 부제 */}
          <p className="text-lg sm:text-xl text-subtext dark:text-[var(--subtext)] mb-12 leading-relaxed max-w-lg mx-auto">
            Cupid가 매일 정오 한 분만 큐레이션합니다.
            <br className="hidden sm:block" />
            매거진처럼, 정중하게.
          </p>

          {/* CTA 버튼 — 호텔 체크인 스타일 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/signup')}
              className="w-full sm:w-auto px-10 py-4 text-base font-semibold text-white bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold rounded-full hover:opacity-90 transition-all shadow-xl shadow-gold/25 dark:shadow-dark-gold/25 active:scale-[0.98]"
            >
              지금 입장하기
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-10 py-4 text-base font-semibold text-gold dark:text-dark-gold border-2 border-gold/40 dark:border-dark-gold/40 rounded-full hover:border-gold dark:hover:border-dark-gold hover:bg-gold/5 dark:hover:bg-dark-gold/5 transition-all"
            >
              로그인
            </button>
          </div>
        </div>
      </section>

      {/* 구분선 */}
      <div className="max-w-xs mx-auto border-t border-gold/20 dark:border-dark-gold/20" />

      {/* Cupid 매거진 큐레이션 소개 섹션 */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-text dark:text-dark-cream mb-4">
            Cupid가 매일 한 분만 추천합니다
          </h2>
          <p className="text-center text-subtext dark:text-[var(--subtext)] mb-14 max-w-lg mx-auto">
            인증 4종(학력·직장·자산·소득)과 라이프스타일 8축을 토대로 Cupid AI가 매일 정오 단 한 분을 큐레이션합니다.
          </p>

          {/* 3단계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: 인증 */}
            <div className="text-center p-8 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40 transition-colors">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 dark:bg-dark-gold/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-gold dark:text-dark-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div className="text-xs font-semibold tracking-widest uppercase text-gold dark:text-dark-gold mb-2">
                Step 1
              </div>
              <h3 className="text-lg font-bold text-text dark:text-dark-cream mb-2">
                신원 인증
              </h3>
              <p className="text-sm text-subtext dark:text-[var(--subtext)] leading-relaxed">
                직업, 학력, 소득 등 실물 인증서를 제출하여 프로필의 진정성을 검증합니다.
              </p>
            </div>

            {/* Step 2: 심사 */}
            <div className="text-center p-8 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40 transition-colors">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 dark:bg-dark-gold/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-gold dark:text-dark-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="text-xs font-semibold tracking-widest uppercase text-gold dark:text-dark-gold mb-2">
                Step 2
              </div>
              <h3 className="text-lg font-bold text-text dark:text-dark-cream mb-2">
                Cupid 큐레이션
              </h3>
              <p className="text-sm text-subtext dark:text-[var(--subtext)] leading-relaxed">
                Cupid AI가 인증·라이프스타일·관심사 8축으로 프로필을 평가하여 매일 정오 한 분을 큐레이션합니다.
              </p>
            </div>

            {/* Step 3: 승인 */}
            <div className="text-center p-8 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40 transition-colors">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 dark:bg-dark-gold/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-gold dark:text-dark-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <div className="text-xs font-semibold tracking-widest uppercase text-gold dark:text-dark-gold mb-2">
                Step 3
              </div>
              <h3 className="text-lg font-bold text-text dark:text-dark-cream mb-2">
                정중한 답장
              </h3>
              <p className="text-sm text-subtext dark:text-[var(--subtext)] leading-relaxed">
                매거진을 읽듯 신중하게 추천을 살펴보고, 마음에 들면 24시간 안에 정중하게 답장하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 매칭 성공 통계 섹션 */}
      <section className="py-20 px-6 bg-white dark:bg-dark-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-text dark:text-dark-cream mb-14">
            숫자로 증명합니다
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '3,847', label: '누적 매칭', suffix: '건' },
              { value: '92', label: '매칭 만족도', suffix: '%' },
              { value: '1,240', label: '인증 회원', suffix: '명' },
              { value: '187', label: '커플 탄생', suffix: '쌍' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-gold dark:text-dark-gold tabular-nums">
                  {stat.value}
                  <span className="text-lg">{stat.suffix}</span>
                </p>
                <p className="mt-2 text-sm text-subtext dark:text-[var(--subtext)]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 쇼케이스 섹션 */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-text dark:text-dark-cream mb-4">
            이런 분들이 활동 중입니다
          </h2>
          <p className="text-center text-subtext dark:text-[var(--subtext)] mb-14">
            실제 인증을 완료한 프리미엄 회원 프로필
          </p>

          {isLoading ? (
            // 로딩 스켈레톤
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)] animate-pulse"
                />
              ))}
            </div>
          ) : showcaseProfiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {showcaseProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="rounded-2xl overflow-hidden bg-white dark:bg-dark-card border border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40 transition-colors"
                >
                  {/* 프로필 이미지 영역 */}
                  <div className="h-48 bg-ivory dark:bg-dark-brown relative overflow-hidden">
                    {profile.appealImageUrl ? (
                      <img
                        src={profile.appealImageUrl}
                        alt={profile.nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-subtext/30" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                    {/* 지역 뱃지 */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-medium bg-white/90 dark:bg-dark-card/90 rounded-full text-text dark:text-dark-cream">
                      {profile.region}
                    </span>
                  </div>

                  {/* 프로필 정보 */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-text dark:text-dark-cream">
                        {profile.nickname}
                      </h3>
                      <span className="text-xs text-subtext dark:text-[var(--subtext)]">
                        {profile.ageRange}
                      </span>
                    </div>
                    <p className="text-sm text-gold dark:text-dark-gold font-medium mb-2">
                      {profile.occupation}
                    </p>
                    {profile.bio && (
                      <p className="text-xs text-subtext dark:text-[var(--subtext)] line-clamp-2 leading-relaxed">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 빈 상태
            <div className="text-center py-12">
              <p className="text-subtext dark:text-[var(--subtext)]">
                현재 쇼케이스 프로필을 준비 중입니다.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 하단 CTA 섹션 — 호텔 VIP 카드 감성 */}
      <section className="py-24 px-6 bg-white dark:bg-dark-card">
        <div className="max-w-2xl mx-auto text-center">
          {/* 골드 장식 */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-px bg-gold/30 dark:bg-dark-gold/30" />
            <span className="text-xs tracking-[0.3em] uppercase text-gold dark:text-dark-gold font-semibold">
              Invitation
            </span>
            <div className="w-16 h-px bg-gold/30 dark:bg-dark-gold/30" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-text dark:text-dark-cream mb-4">
            로미오와 큐피트가
            <br />
            당신을 기다립니다
          </h2>
          <p className="text-subtext dark:text-[var(--subtext)] mb-10 leading-relaxed">
            매일 정오, Cupid가 단 한 분을 골라 보냅니다.
            <br />
            지금 입장하고 내일 정오의 첫 추천을 만나보세요.
          </p>
          <button
            onClick={() => router.push('/signup')}
            className="px-12 py-4 text-base font-semibold text-white bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold rounded-full hover:opacity-90 transition-all shadow-xl shadow-gold/25 dark:shadow-dark-gold/25 active:scale-[0.98]"
          >
            무료로 입장하기
          </button>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-10 px-6 border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-subtext dark:text-[var(--subtext)]">
            &copy; 2026 Romeo & Cupid. All rights reserved.
          </p>
          <p className="text-xs text-subtext/60 dark:text-[var(--subtext)]/60 mt-2">
            서울특별시 | 사업자등록번호: 000-00-00000
          </p>
        </div>
      </footer>
    </div>
  );
}
