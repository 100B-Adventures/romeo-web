// CupidQuote — 매거진 인용부호 + Cupid가 골라준 이유 + "— Cupid" 시그니처
// R21 컨셉 전환 핵심 컴포넌트 (Editorial 매거진 톤)

import React from 'react';

interface Props {
  reason: string;
  matchScore?: number;
}

const FALLBACK = 'Cupid가 직업·지역·관심사를 두루 살펴 골랐어요.';

export function CupidQuote({ reason, matchScore }: Props) {
  const text = reason && reason.trim().length > 0 ? reason : FALLBACK;

  return (
    <figure className="my-6 border-y py-6" style={{ borderColor: 'var(--cupid-meta-border)' }}>
      <span className="cupid-quote-mark block leading-none mb-2">“</span>
      <blockquote className="italic text-base leading-7 text-gray-900">{text}</blockquote>
      <figcaption className="mt-4 flex items-center gap-2">
        <span className="block h-px w-6" style={{ backgroundColor: 'var(--cupid-meta-border)' }} />
        <span className="cupid-meta" style={{ fontSize: 13, letterSpacing: 0.5 }}>
          — Cupid
        </span>
      </figcaption>
      {typeof matchScore === 'number' && matchScore > 0 && (
        <p className="cupid-meta mt-2" style={{ fontSize: 11, letterSpacing: 1 }}>
          매칭 점수 {Math.round(matchScore)}
        </p>
      )}
    </figure>
  );
}
