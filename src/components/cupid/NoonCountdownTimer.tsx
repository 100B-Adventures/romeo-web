'use client';

// NoonCountdownTimer — 다음 정오까지 카운트다운 (HH:MM:SS)
// R21 컨셉 전환: 빈 시간 매거진 시그니처

import React, { useEffect, useState } from 'react';

interface Props {
  targetTime?: Date;
  label?: string;
}

function getNextNoonKst(): Date {
  const now = new Date();
  const next = new Date(now);
  // KST 정오 = UTC 03:00
  next.setUTCHours(3, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

function formatRemain(ms: number): { hh: string; mm: string; ss: string } {
  if (ms <= 0) return { hh: '00', mm: '00', ss: '00' };
  const totalSec = Math.floor(ms / 1000);
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return { hh, mm, ss };
}

export function NoonCountdownTimer({ targetTime, label = '다음 한 분까지' }: Props) {
  const [target] = useState<Date>(() => targetTime ?? getNextNoonKst());
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { hh, mm, ss } = formatRemain(target.getTime() - now);

  return (
    <div className="flex flex-col items-center py-8 px-4 text-center">
      <span className="cupid-meta mb-2">{label}</span>
      <time
        className="cupid-headline"
        style={{
          fontSize: 48,
          fontWeight: 300,
          letterSpacing: 4,
          margin: '12px 0',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {hh}:{mm}:{ss}
      </time>
      <span className="block h-px w-8 my-3" style={{ backgroundColor: 'var(--cupid-meta-border)' }} />
      <p className="cupid-meta italic" style={{ letterSpacing: 0, textTransform: 'none', fontSize: 13 }}>
        Cupid가 매일 정오, 단 한 분을 골라드려요.
      </p>
    </div>
  );
}
