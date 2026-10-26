import type { ProfileDetailResponse } from '@/lib/api/profile';
import styles from './ProfileEditorial.module.css';

type Fact = readonly [string, string | number | undefined];

export function CupidLetter({ reason }: { reason?: string }) {
  if (!reason?.trim()) return null;
  return (
    <section className={styles.letter} data-testid="cupid-letter">
      <p className={styles.letterKicker}>CUPID&apos;S LETTER · 큐피드의 편지</p>
      <p className={styles.letterQuote}>&ldquo;{reason}&rdquo;</p>
      <p className={styles.letterSignature}>Cupid</p>
    </section>
  );
}

export function ReadProfileButton({ nickname, onClick }: { nickname: string; onClick?: () => void }) {
  return <div className={styles.readMore}><button className={styles.readMoreButton} onClick={onClick}>{nickname} 님의 지면 전체 읽기 ›</button></div>;
}

const LABELS: Record<string, string> = { IDENTITY: '본인', CAREER: '직장', EDUCATION: '학력', INCOME: '소득', RESIDENCE: '거주지' };

function verifiedValue(badge: string, profile: Partial<ProfileDetailResponse>) {
  if (badge === 'CAREER') return profile.company || profile.occupation;
  if (badge === 'EDUCATION') return profile.school || profile.education;
  if (badge === 'INCOME') return profile.incomeRange;
  if (badge === 'RESIDENCE') return profile.location;
  return badge === 'IDENTITY' ? '실명 · 휴대폰 번호' : undefined;
}

export function VerifiedPanel({ profile, compactId }: { profile: Partial<ProfileDetailResponse>; compactId?: string | number }) {
  const badges = profile.verificationBadges?.length ? profile.verificationBadges : profile.verified ? ['IDENTITY'] : [];
  if (!badges.length) return null;
  return (
    <section className={styles.verified} data-testid="profile-verified">
      <div className={styles.verifiedHead}><h2 className={styles.verifiedTitle}>Verified</h2><span className={styles.verifiedNumber}>No. {compactId ?? profile.userId ?? profile.profileId}</span></div>
      {badges.map((badge) => <div className={styles.verifiedRow} key={badge}><span className={styles.verifiedLabel}>{LABELS[badge] ?? badge}</span><span className={styles.verifiedValue}>{verifiedValue(badge, profile) || '인증 완료'}</span><span className={styles.verifiedCheck} aria-label="확인됨">✓</span></div>)}
      <div className={styles.verifiedFoot}><span>큐피드가 원본 서류를 직접 확인했습니다</span><span className={styles.signature}>Cupid</span></div>
    </section>
  );
}

export function AboutPanel({ bio }: { bio?: string }) {
  if (!bio?.trim()) return null;
  return <section className={styles.about} data-testid="detail-about"><p className={styles.aboutBody}>{bio}</p><div className={styles.aboutSignature}><span className={styles.signatureLine} /><span className={styles.signature}>Cupid</span><span className={styles.signatureLabel}>가 다듬은 소개</span></div></section>;
}

function SectionTitle({ children }: { children: string }) {
  return <div className={styles.sectionTitle}><h2 className={styles.sectionKicker}>{children}</h2><span className={styles.sectionLine} /></div>;
}

export function FactFile({ facts }: { facts: Fact[] }) {
  const visible = facts.filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!visible.length) return null;
  return <section data-testid="detail-fact-file"><SectionTitle>FACT FILE · 기본 정보</SectionTitle><div className={styles.factPanel}>{visible.map(([label, value], index) => <div className={styles.factCell} key={label}><span className={styles.factIndex}>{String(index + 1).padStart(2, '0')}</span><span className={styles.factLabel}>{label}</span><strong className={styles.factValue}>{value}</strong></div>)}</div></section>;
}

export function NarrativeSections({ items }: { items: Fact[] }) {
  const visible = items.filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!visible.length) return null;
  return <div data-testid="detail-narratives">{visible.map(([label, value]) => <section className={styles.narrative} key={label}><SectionTitle>{label}</SectionTitle><p className={styles.narrativeBody}>{value}</p></section>)}</div>;
}

export function CupidBrandCard({ memberId }: { memberId: number }) {
  return <section className={styles.brandCard} data-testid="detail-brand-card"><h2 className={styles.brandWord}>CUPID</h2><p className={styles.brandSub}>큐피드가 확인한 지면</p><p className={styles.brandCopy}>인증과 사진은 큐피드가 원본과 대조했습니다.<br />확인한 사실의 범위에서 책임집니다.</p><footer className={styles.brandFooter}><span>제12호 · M-{memberId}</span><span>ROMEO &amp; CUPID</span></footer></section>;
}

export const editorialStyles = styles;
