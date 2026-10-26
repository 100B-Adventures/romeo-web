'use client';

// 프로필 카드 액션 버튼 3종
// Pass(X) / Like(하트, 5,000원) / Super OK(별, 10,000원)

interface ActionButtonsProps {
  onPass: () => void;
  onLike: () => void;
  onSuperOk: () => void;
  /** 버튼 비활성화 (로딩 중 등) */
  disabled?: boolean;
}

export default function ActionButtons({
  onPass,
  onLike,
  onSuperOk,
  disabled = false,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {/* Pass 버튼 (X) — 회색 */}
      <button
        type="button"
        onClick={onPass}
        disabled={disabled}
        aria-label="넘기기"
        className="
          flex h-14 w-14 items-center justify-center
          rounded-full border-2 border-gray-200 dark:border-gray-700
          bg-white dark:bg-dark-card
          text-gray-400 dark:text-gray-500
          shadow-sm
          transition-all duration-200
          hover:border-gray-300 hover:text-gray-500 hover:shadow-md hover:scale-105
          active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        "
      >
        {/* X 아이콘 */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Like 버튼 (하트, 5,000원) — 골드 */}
      <button
        type="button"
        onClick={onLike}
        disabled={disabled}
        aria-label="좋아요 (5,000원)"
        className="
          relative flex h-16 w-16 flex-col items-center justify-center
          rounded-full
          bg-gradient-to-br from-gold to-rosegold
          dark:from-dark-gold dark:to-rosegold
          text-white
          shadow-lg shadow-gold/30 dark:shadow-dark-gold/20
          transition-all duration-200
          hover:shadow-xl hover:shadow-gold/40 hover:scale-110
          active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        "
      >
        {/* 하트 아이콘 */}
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>

        {/* 가격 표시 */}
        <span className="absolute -bottom-6 whitespace-nowrap text-[10px] font-medium text-gold dark:text-dark-gold">
          5,000원
        </span>
      </button>

      {/* Super OK 버튼 (별, 10,000원) — 골드 강조 */}
      <button
        type="button"
        onClick={onSuperOk}
        disabled={disabled}
        aria-label="Super OK (10,000원)"
        className="
          relative flex h-14 w-14 flex-col items-center justify-center
          rounded-full border-2 border-gold dark:border-dark-gold
          bg-gold/10 dark:bg-dark-gold/10
          text-gold dark:text-dark-gold
          shadow-sm
          transition-all duration-200
          hover:bg-gold/20 hover:shadow-md hover:scale-105
          active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        "
      >
        {/* 별 아이콘 */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>

        {/* 가격 표시 */}
        <span className="absolute -bottom-6 whitespace-nowrap text-[10px] font-medium text-gold dark:text-dark-gold">
          10,000원
        </span>
      </button>
    </div>
  );
}
