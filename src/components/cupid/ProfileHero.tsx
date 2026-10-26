'use client';

import { useState, type ReactNode } from 'react';
import styles from './ProfileHero.module.css';

export interface ProfileHeroProps {
  photoUrl?: string; nickname: string; age?: number; location?: string; height?: number;
  bodyType?: string; religion?: string; mbti?: string; occupation?: string; verified?: boolean;
  matchScore?: number; kicker?: string; onPhotoPress?: () => void; leadingControl?: ReactNode;
  trailingControl?: ReactNode; testId?: string;
}

export function ProfileHero({ photoUrl, nickname, age, location, height, bodyType, religion, mbti,
  occupation, verified = false, matchScore, kicker = "TODAY'S ONE · 오늘의 인물",
  onPhotoPress, leadingControl, trailingControl, testId = 'profile-hero' }: ProfileHeroProps) {
  // 사진 주소가 있어도 실제로 못 그릴 수 있다. 스테이지에서 회원 사진 일부가 이미지가 아니라
  // 저장소 오류 문서(263바이트 XML)로 올라가 있었고 응답 코드가 200 이라 아무도 실패로 보지 않았다.
  // 그래서 사진 자리가 아무 안내 없이 빈 칸으로만 남았다(2026-09-09 앱 실기 QA 최초 관찰).
  const [photoFailed, setPhotoFailed] = useState(false);
  const usablePhoto = photoFailed ? undefined : photoUrl;
  const dossier = [location, height ? `${height}CM` : undefined, bodyType, religion, mbti].filter(Boolean);
  return (
    <section className={styles.root} data-testid={testId}>
      <div className={styles.stage} onClick={onPhotoPress}>
        {usablePhoto ? (
          // API와 가입 플로우가 임의 원격 사진 URL을 반환하므로 next/image 도메인을 정적으로 열 수 없다.
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.photo} src={usablePhoto} alt={nickname} data-testid="profile-hero-photo"
            onError={() => setPhotoFailed(true)} />
        ) : (
          <div className={styles.emptyPhoto} data-testid="profile-hero-photo-fallback"
            aria-label={photoFailed ? '사진을 불러오지 못했어요' : '등록된 사진 없음'}>♡</div>
        )}
        <div className={styles.tint} />
        {leadingControl ? <div className={styles.back}>{leadingControl}</div> : null}
        {trailingControl ? <div className={styles.menu}>{trailingControl}</div> : null}
        {typeof matchScore === 'number' && matchScore > 0 ? <span className={styles.score}>★ 궁합 {Math.round(matchScore)}</span> : null}
        {verified ? <span className={styles.verified}>✓ VERIFIED MEMBER</span> : null}
        <div className={styles.caption}>
          <p className={styles.kicker}>{kicker}</p>
          <h1 className={styles.name}>{nickname}{age ? <span className={styles.age}>, {age}</span> : null}</h1>
        </div>
      </div>
      {dossier.length > 0 ? <div className={styles.dossier} data-testid="profile-dossier">{dossier.map((fact) => <span className={styles.fact} key={fact}>{fact}</span>)}</div> : null}
      {occupation ? <div className={styles.profession}><p className={styles.professionKicker}>PROFESSION</p><p className={styles.professionValue}>{occupation}{verified ? '  ◈' : ''}</p></div> : null}
    </section>
  );
}
