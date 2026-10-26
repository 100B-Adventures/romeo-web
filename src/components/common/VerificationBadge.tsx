// 인증 뱃지 컴포넌트
// 5종 인증: IDENTITY, EDUCATION, INCOME, CAREER, RESIDENCE
// 인증된 항목은 골드, 미인증은 회색

// 인증 종류별 한국어 라벨
const VERIFICATION_LABELS: Record<string, string> = {
  IDENTITY: '신원',
  EDUCATION: '학력',
  INCOME: '소득',
  CAREER: '직장',
  RESIDENCE: '거주',
};

// 전체 인증 항목 목록
const ALL_VERIFICATIONS = ['IDENTITY', 'EDUCATION', 'INCOME', 'CAREER', 'RESIDENCE'];

interface VerificationBadgeProps {
  verifications: string[];
}

// 체크마크 아이콘 (SVG)
function CheckIcon({ verified }: { verified: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={verified ? 'text-gold dark:text-dark-gold' : 'text-gray-300 dark:text-gray-600'}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export default function VerificationBadge({ verifications }: VerificationBadgeProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_VERIFICATIONS.map((type) => {
        const verified = verifications.includes(type);
        return (
          <div
            key={type}
            className={`
              inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium
              transition-colors
              ${
                verified
                  ? 'bg-gold/10 text-gold dark:bg-dark-gold/10 dark:text-dark-gold'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
              }
            `}
          >
            <CheckIcon verified={verified} />
            {VERIFICATION_LABELS[type]}
          </div>
        );
      })}
    </div>
  );
}
