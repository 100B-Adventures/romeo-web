// TodayCard — Editorial 매거진 톤 단일 카드
// R21 컨셉 전환: NO.142 · 일자 라벨 + 대표 사진 + 닉네임 + 인증 뱃지

import React from 'react';
import Image from 'next/image';

interface Props {
  no: number;
  date: string;
  photoUrl?: string;
  nickname: string;
  age?: number;
  jobTitle?: string;
  locationCity?: string;
  verifiedBadges?: string[];
  onClick?: () => void;
  href?: string;
}

export function TodayCard({
  no,
  date,
  photoUrl,
  nickname,
  age,
  jobTitle,
  locationCity,
  verifiedBadges = [],
  onClick,
  href,
}: Props) {
  const inner = (
    <article className="px-4 py-5 cursor-pointer hover:opacity-95 transition-opacity">
      {/* 매거진 메타 라벨 */}
      <header className="flex items-center gap-1">
        <span className="cupid-meta">NO. {no}</span>
        <span className="cupid-meta">·</span>
        <span className="cupid-meta">{date}</span>
        <span className="cupid-meta">·</span>
        <span className="cupid-meta" style={{ color: 'var(--cupid-accent)' }}>
          오늘의 한 분
        </span>
      </header>
      <hr className="mt-2 mb-4 border-0 h-px" style={{ backgroundColor: 'var(--cupid-meta-border)' }} />

      {/* 대표 사진 */}
      {photoUrl && (
        <div className="relative w-full mb-4 cupid-photo" style={{ aspectRatio: '0.78' }}>
          <Image
            src={photoUrl}
            alt={nickname}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}

      {/* 닉네임 (serif headline) */}
      <h2 className="cupid-headline" style={{ fontSize: 32, letterSpacing: 0.5 }}>
        {nickname}
      </h2>

      {/* 메타 정보 */}
      <p className="text-sm text-gray-600 mt-1">
        {[age && `${age}세`, locationCity, jobTitle].filter(Boolean).join(' · ')}
      </p>

      {/* 인증 뱃지 */}
      {verifiedBadges.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {verifiedBadges.map((b) => (
            <span
              key={b}
              className="px-2 py-1 rounded-full border text-xs font-medium"
              style={{ borderColor: 'var(--cupid-accent)', color: 'var(--cupid-accent)', letterSpacing: 0.5 }}
            >
              ✓ {b}
            </span>
          ))}
        </div>
      )}
    </article>
  );

  if (href) {
    // Next.js Link 사용 권장이지만 의존 단순화 위해 a 태그
    return (
      <a href={href} className="block no-underline text-inherit">
        {inner}
      </a>
    );
  }
  if (onClick) {
    return (
      <button onClick={onClick} className="text-left w-full bg-transparent border-0 p-0">
        {inner}
      </button>
    );
  }
  return inner;
}
