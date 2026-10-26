// 로딩 화면 — R21 "골든 하트비트" 프리미엄 모션 (웹·모바일 parity)
// 심장박동(lub-dub) 하트 + 퍼지는 동심원 리플 2개 + 회전 그라데이션 링 + shimmer 워드마크.
// 새 의존성 없음: 순수 CSS keyframes.

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ivory dark:bg-dark-bg transition-colors">
      {/* 스테이지: 글로우 + 리플 + 회전링 + 하트 */}
      <div className="relative flex h-[132px] w-[132px] items-center justify-center">
        {/* 글로우 (하트비트에 맞춰 번짐) */}
        <div className="rnc-glow absolute h-24 w-24 rounded-full bg-gold/40 dark:bg-dark-gold/40 blur-xl" />

        {/* 퍼지는 동심원 리플 2개 (lub / dub) */}
        <div className="rnc-ripple absolute h-24 w-24 rounded-full border-[1.5px] border-gold dark:border-dark-gold" />
        <div className="rnc-ripple rnc-ripple-2 absolute h-24 w-24 rounded-full border-[1.5px] border-rosegold" />

        {/* 회전 그라데이션 아크 링 */}
        <div className="rnc-spin absolute h-[104px] w-[104px] rounded-full border-[2.5px] border-gold/10 dark:border-dark-gold/10 border-t-gold border-r-rosegold dark:border-t-dark-gold" />

        {/* 중앙 디스크 + 심장박동 하트 */}
        <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white dark:bg-dark-card shadow-[0_4px_18px_rgba(184,134,11,0.32)]">
          <svg width="34" height="34" viewBox="0 0 48 48" fill="none" className="rnc-beat text-gold dark:text-dark-gold">
            <path
              d="M24 42l-2.1-1.9C11.4 30.8 6 25.9 6 19.5 6 14.4 10 10.5 15 10.5c2.8 0 5.5 1.3 7 3.3 1.5-2 4.2-3.3 7-3.3 5 0 9 3.9 9 9 0 6.4-5.4 11.3-15.9 20.7L24 42z"
              fill="currentColor"
              opacity="0.95"
            />
            <circle cx="24" cy="20" r="4" fill="white" className="dark:fill-dark-card" />
            <rect x="22.5" y="23" width="3" height="10" rx="1.5" fill="white" className="dark:fill-dark-card" />
            <rect x="25" y="28" width="4" height="2" rx="1" fill="white" className="dark:fill-dark-card" />
          </svg>
        </div>
      </div>

      {/* shimmer 워드마크 */}
      <h1 className="rnc-shimmer mt-5 pr-2 text-4xl font-semibold italic">Cupid</h1>
      <p className="mt-1.5 text-[10px] font-semibold tracking-[0.35em] text-subtext dark:text-gray-400">
        ROMEO · N · CUPID
      </p>

      {/* 안내 텍스트 */}
      <p className="mt-4 text-sm text-subtext dark:text-gray-400">큐피드가 살펴보는 중...</p>

      {/* 하단 장식 라인 */}
      <div className="mt-7 flex items-center gap-2">
        <div className="h-px w-11 bg-gradient-to-r from-transparent to-gold/40 dark:to-dark-gold/40" />
        <div className="h-[5px] w-[5px] rounded-full bg-gold dark:bg-dark-gold" />
        <div className="h-px w-11 bg-gradient-to-r from-gold/40 to-transparent dark:from-dark-gold/40" />
      </div>

      <style>{`
        @keyframes rnc-beat {
          0%, 40%, 100% { transform: scale(1); }
          14% { transform: scale(1.22); }
          28% { transform: scale(1.04); }
          34% { transform: scale(1.14); }
        }
        @keyframes rnc-ripple {
          0% { transform: scale(0.55); opacity: 0; }
          15% { opacity: 0.45; }
          100% { transform: scale(2.3); opacity: 0; }
        }
        @keyframes rnc-glow {
          0%, 40%, 100% { opacity: 0.18; transform: scale(1); }
          14% { opacity: 0.5; transform: scale(1.35); }
          34% { opacity: 0.4; transform: scale(1.25); }
        }
        @keyframes rnc-spin { to { transform: rotate(360deg); } }
        @keyframes rnc-shimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .rnc-beat { animation: rnc-beat 1.4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .rnc-ripple { animation: rnc-ripple 1.4s ease-out infinite; }
        .rnc-ripple-2 { animation-delay: 0.4s; }
        .rnc-glow { animation: rnc-glow 1.4s ease-in-out infinite; }
        .rnc-spin { animation: rnc-spin 3.4s linear infinite; }
        .rnc-shimmer {
          /* 라이트/다크 무관 고정 골드 그라데이션. --wordmark-shimmer-*는 globals.css :root에만 정의되고
             .dark에서 재정의하지 않아 테마와 무관하게 항상 같은 값이다(원래 하드코딩 의도 보존) */
          background: linear-gradient(100deg, var(--wordmark-shimmer-1) 20%, var(--wordmark-shimmer-2) 45%, var(--wordmark-shimmer-3) 50%, var(--wordmark-shimmer-2) 55%, var(--wordmark-shimmer-1) 80%);
          background-size: 220% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: rnc-shimmer 2.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .rnc-beat, .rnc-ripple, .rnc-glow, .rnc-spin, .rnc-shimmer { animation: none; }
        }
      `}</style>
    </div>
  );
}
