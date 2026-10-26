// 하트 잔액 표시 뱃지
// 골드 색상의 하트 아이콘 + 잔액 숫자
interface HeartBadgeProps {
  balance: number;
}

export default function HeartBadge({ balance }: HeartBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 dark:bg-dark-gold/10 px-3 py-1.5">
      {/* 하트 아이콘 (SVG) */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-gold dark:text-dark-gold"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>

      {/* 잔액 숫자 */}
      <span className="text-sm font-semibold text-gold dark:text-dark-gold tabular-nums">
        {balance.toLocaleString()}
      </span>
    </div>
  );
}
