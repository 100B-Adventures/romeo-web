// 퍼센타일 순위 뱃지
// "상위 3%" 형태로 표시. 상위 5% 이하면 빛나는 효과 적용
interface PercentileBadgeProps {
  rank: number;
}

export default function PercentileBadge({ rank }: PercentileBadgeProps) {
  // 상위 5% 이하 여부
  const isElite = rank <= 5;

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold
        bg-gold/15 text-gold dark:bg-dark-gold/15 dark:text-dark-gold
        ${isElite ? 'animate-pulse shadow-[0_0_8px_rgba(184,134,11,0.4)] dark:shadow-[0_0_8px_rgba(201,169,110,0.4)]' : ''}
      `}
    >
      {/* 왕관 아이콘 (상위 5% 이하만 표시) */}
      {isElite && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-gold dark:text-dark-gold"
        >
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
        </svg>
      )}
      상위 {rank}%
    </span>
  );
}
