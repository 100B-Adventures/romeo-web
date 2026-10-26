'use client';

import { useEffect, useState } from 'react';
import { pricingApi, CurrentPricingResponse } from '@/lib/api/pricing';
import { costPillLabel } from './heroCardPricing';
import { ProfileHero } from './ProfileHero';
import { CupidLetter, ReadProfileButton, VerifiedPanel, editorialStyles } from './ProfileEditorial';

interface Props {
  profileId?: number; userId?: number; photoUrl?: string; nickname: string; age?: number;
  locationCity?: string; height?: number; bodyType?: string; religion?: string; mbti?: string;
  jobTitle?: string; company?: string; education?: string; school?: string; incomeRange?: string;
  verifiedBadges?: string[]; identityVerified?: boolean; matchScore?: number; cupidReason?: string;
  initialRevealed?: boolean; sentLike?: 'OK' | 'SUPER_OK'; matched?: boolean;
  onOpen?: () => void; onOk?: () => void; onSuperOk?: () => void;
}

const FALLBACK_REASON = 'Cupid가 직업·지역·관심사를 두루 살펴 골랐어요.';

export function TodayHeroCard({ profileId, userId, photoUrl, nickname, age, locationCity, height,
  bodyType, religion, mbti, jobTitle, company, education, school, incomeRange,
  verifiedBadges = [], matchScore, cupidReason, sentLike, matched, onOpen, onOk, onSuperOk }: Props) {
  const hasVerifiedBadge = verifiedBadges.length > 0;
  const [pricing, setPricing] = useState<CurrentPricingResponse | null>(null);
  useEffect(() => {
    let cancelled = false;
    pricingApi.getCurrentPricing().then((value) => { if (!cancelled) setPricing(value); }).catch(() => setPricing(null));
    return () => { cancelled = true; };
  }, []);

  return (
    <article className="bg-[var(--cupid-idv-bg)]" data-testid="today-single-hero">
      <ProfileHero photoUrl={photoUrl} nickname={nickname} age={age} location={locationCity}
        height={height} bodyType={bodyType} religion={religion} mbti={mbti}
        occupation={jobTitle} verified={hasVerifiedBadge} matchScore={matchScore}
        onPhotoPress={onOpen} testId="today-profile-hero" />
      <CupidLetter reason={cupidReason?.trim() || FALLBACK_REASON} />
      <ReadProfileButton nickname={nickname} onClick={onOpen} />
      <VerifiedPanel profile={{ profileId, userId, nickname, location: locationCity, occupation: jobTitle,
        company, education, school, incomeRange, verificationBadges: verifiedBadges,
        verified: hasVerifiedBadge }} compactId={profileId} />
      <div className={editorialStyles.actions}>
        {matched ? <button className={editorialStyles.secondaryButton} onClick={onOpen}>히스토리에서 연락처 확인</button>
          : sentLike ? <p className={editorialStyles.secondaryButton}>{sentLike === 'SUPER_OK' ? '슈퍼 OK를 보냈어요' : 'OK를 보냈어요'}</p>
          : <><button className={editorialStyles.secondaryButton} onClick={onOk} disabled={!pricing}>OK <span>{costPillLabel(pricing, 'OK')}</span></button>
            <button className={editorialStyles.primaryButton} onClick={onSuperOk} disabled={!pricing}>슈퍼 OK <span>{costPillLabel(pricing, 'SUPER_OK')}</span></button></>}
      </div>
    </article>
  );
}
