// 빈 상태 표시 컴포넌트
// 호텔 감성 일러스트 느낌의 빈 상태 안내

interface EmptyStateProps {
  /** 상단 아이콘 (유니코드 이모지 또는 문자). 미지정 시 기본 열쇠 아이콘 */
  icon?: string;
  /** 안내 제목 */
  title: string;
  /** 부가 설명 */
  description?: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* 아이콘 영역 — 호텔 감성 원형 프레임 */}
      <div className="relative mb-6">
        {/* 장식 원 (골드 테두리) */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-gold/30 dark:border-dark-gold/30 bg-gold/5 dark:bg-dark-gold/5">
          {icon ? (
            // 사용자 지정 아이콘
            <span className="text-4xl leading-none">{icon}</span>
          ) : (
            // 기본 아이콘: 문이 열린 호텔 방 (SVG)
            <svg
              width="40"
              height="40"
              viewBox="0 0 48 48"
              fill="none"
              className="text-gold/60 dark:text-dark-gold/60"
            >
              {/* 문 프레임 */}
              <rect
                x="10"
                y="6"
                width="28"
                height="36"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              {/* 문 */}
              <rect
                x="16"
                y="10"
                width="16"
                height="28"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
              {/* 문 손잡이 */}
              <circle cx="28" cy="26" r="1.5" fill="currentColor" />
            </svg>
          )}
        </div>

        {/* 장식 점 */}
        <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-gold/40 dark:bg-dark-gold/40" />
        <div className="absolute -bottom-1 -left-1 h-1.5 w-1.5 rounded-full bg-gold/25 dark:bg-dark-gold/25" />
      </div>

      {/* 제목 */}
      <h3 className="text-lg font-medium text-text dark:text-dark-cream">
        {title}
      </h3>

      {/* 설명 */}
      {description && (
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-subtext dark:text-gray-400">
          {description}
        </p>
      )}

      {/* 하단 장식 라인 */}
      <div className="mt-6 flex items-center gap-2">
        <div className="h-px w-8 bg-gold/20 dark:bg-dark-gold/20" />
        <div className="h-1 w-1 rounded-full bg-gold/40 dark:bg-dark-gold/40" />
        <div className="h-px w-8 bg-gold/20 dark:bg-dark-gold/20" />
      </div>
    </div>
  );
}
