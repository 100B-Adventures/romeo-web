'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { matchingApi, type SentLikeResultResponse } from '@/lib/api/matching';
import { remainingUntil } from '@/lib/okSentRoute';
import TopHeader from '@/components/layout/TopHeader';
import styles from './OkSent.module.css';

function formatRemain(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalMinutes = Math.floor(ms / 60_000);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  return (error as { response?: { data?: { code?: string } } }).response?.data?.code;
}

export default function OkSentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const likeId = Number(searchParams.get('likeId'));
  const [profile, setProfile] = useState<SentLikeResultResponse | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const [remain, setRemain] = useState<number | null>(null);

  const currentProfile = profile;
  const nickname = currentProfile?.nickname?.trim();
  const photoUrl = currentProfile?.photoUrl?.trim();
  const likeType = currentProfile?.likeType === 'SUPER_OK' ? 'SUPER_OK' : 'OK';
  const hasRecipient = Boolean(nickname);
  const isMatched = currentProfile?.status === 'MATCHED';
  const isRejected = currentProfile?.status === 'REJECTED';
  const isExpired = currentProfile?.status === 'EXPIRED'
    || (currentProfile?.status === 'PENDING' && hasRecipient && remain !== null && remain === 0);

  useEffect(() => {
    setProfile(null);
    setFailedPhotoUrl(null);
    setRefreshFailed(false);
    setRemain(null);
    if (!Number.isFinite(likeId) || likeId <= 0) {
      setRefreshFailed(true);
      return;
    }
    let active = true;
    let pollTimer: number | undefined;
    let latestStatus: SentLikeResultResponse['status'] | null = null;
    const load = async () => {
      try {
        const recipient = await matchingApi.getSentLikeById(likeId);
        if (!active) return;
        latestStatus = recipient.status;
        if (recipient.status === 'MATCHED') {
          setRemain(null);
          setProfile(recipient);
          setRefreshFailed(false);
          return;
        }
        if (!recipient.expiresAt) throw new Error('보낸 OK 기록의 만료시각이 없습니다.');
        setRemain(remainingUntil(recipient.expiresAt));
        setProfile(recipient);
        setRefreshFailed(false);
        if (recipient.status === 'PENDING') pollTimer = window.setTimeout(load, 60_000);
      } catch (error) {
        if (!active) return;
        if (getErrorCode(error) === 'MATCH_005') {
          setProfile(null);
          setRefreshFailed(true);
          return;
        }
        setRefreshFailed(true);
        if (latestStatus === 'PENDING') pollTimer = window.setTimeout(load, 60_000);
      }
    };
    void load();
    return () => {
      active = false;
      if (pollTimer) window.clearTimeout(pollTimer);
    };
  }, [likeId]);

  useEffect(() => {
    if (!currentProfile?.expiresAt) {
      setRemain(null);
      return;
    }

    let timer: number | undefined;
    const update = () => {
      const next = remainingUntil(currentProfile.expiresAt);
      setRemain(next);
      if (next > 0) timer = window.setTimeout(update, (next % 60_000 || 60_000) + 50);
    };
    update();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [currentProfile?.expiresAt]);

  return (
    <section className={styles.screen} data-testid="ok-sent-screen">
      <aside className={styles.rail} aria-label="응답 대기 안내">
        <p className={styles.railKicker}>{isMatched ? 'MATCHED' : 'AWAITING REPLY'}</p>
        <h2>{isMatched ? <>{nickname} 님과<br />마음이 닿았어요</> : <>{nickname ? `${nickname} 님의` : '상대의'}<br />답을 기다리는 중</>}</h2>
        <p>{isMatched ? <>알림에서 <b>매칭 지면</b>을 열어 두 분의 다음 안내를 확인해 주세요.</> : <>보낸 관심은 <b>상호 OK</b>가 확인될 때만 연락처로 이어집니다. 한쪽 의도만으로 매칭되지 않습니다.</>}</p>
        <hr />
        <p className={styles.railKicker}>{isMatched ? 'NEXT STEP' : '기다리는 동안'}</p>
        <p>{isMatched ? <>매칭 지면은 <b>도착한 알림</b>을 통해서만 열립니다.</> : <>소개는 멈추지 않아요. <b>내일 정오의 새 지면은 그대로 도착</b>하고, 답이 오면 알림으로 바로 알려드립니다.</>}</p>
      </aside>

      <div className={styles.paper}>
        <TopHeader variant="back" title={isMatched ? '매칭 성사' : '응답 대기'} inline onBack={() => router.replace('/home')} />
        <div className={styles.body}>
        {hasRecipient ? (
          <>
            <p className={`${styles.kicker} ${isExpired || isRejected ? styles.offText : ''}`}>
              {isMatched ? 'MATCHED' : isRejected ? 'CLOSED' : isExpired ? 'EXPIRED' : likeType === 'SUPER_OK' ? 'SUPER OK SENT' : 'OK SENT'}
            </p>
            <h1 className={styles.title} data-testid="ok-sent-recipient-name">
              {isMatched ? <>{nickname} 님도<br /><span>OK했어요</span></> : isRejected ? <>이번 지면은<br />여기서 <span>접었습니다</span></> : isExpired ? <>24시간이<br /><span>지났어요</span></> : <>{nickname} 님에게<br /><span>관심</span>을 전했어요</>}
            </h1>

            <div className={styles.photoFrame} data-testid="ok-sent-photo-card">
              <div className={styles.photoCard}>
                {photoUrl && failedPhotoUrl !== photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={isExpired || isRejected ? styles.expiredPhoto : ''} src={photoUrl} alt={`${nickname} 프로필`} onError={() => setFailedPhotoUrl(photoUrl)} data-testid="ok-sent-photo" />
                ) : (
                  <p className={styles.photoUnavailable} data-testid="ok-sent-photo-unavailable">사진을 불러오지 못했어요</p>
                )}
              </div>
            </div>

            <div className={`${styles.waiting} ${isExpired || isRejected ? styles.waitingExpired : ''}`}><i />{isMatched ? '상대도 OK했어요' : isRejected ? '상대가 지나갔어요' : isExpired ? '응답 없이 자동 종료' : '응답 대기 중'}</div>
            {isMatched ? <p className={styles.closedDeck}>두 분의 마음이 닿았어요. 알림에서 매칭 지면을 확인해 주세요.</p> : isRejected ? <p className={styles.closedDeck}>서로의 결이 맞을 때만 연결하는 것이 큐피드의 방식이에요. 이번엔 {nickname} 님이 지나갔지만, 회원님의 지면은 그대로 남아 있습니다.</p> : <><p className={styles.timer} data-testid="ok-sent-timer">{formatRemain(remain ?? 0)}</p><p className={styles.timerLabel}>남은 시간</p></>}

            <div className={styles.info}>
              <p className={styles.infoTitle}>{isMatched || isExpired ? '다음 걸음' : isRejected ? '그래서 지금' : '이후에 일어나는 일'}</p>
              {isMatched ? (
                <><InfoRow n="I">매칭 알림을 눌러 지면으로 들어가요.</InfoRow><InfoRow n="II">연락처와 다음 안내는 매칭 지면에서 확인해요.</InfoRow></>
              ) : isRejected ? (
                <><InfoRow n="I">지나간 지면은 다시 추천되지 않아요. 읽고 접은 지면이기 때문입니다.</InfoRow><InfoRow n="II">내일 정오, 새 지면이 도착합니다.</InfoRow></>
              ) : isExpired ? (
                <><InfoRow n="I">무응답이 이어지면 큐피드가 이벤트 하트로 보답해요.</InfoRow><InfoRow n="II">내일 정오에 새 지면이 도착합니다.</InfoRow><InfoRow n="III">같은 일이 반복되면 큐레이션 기준을 함께 조정해요.</InfoRow></>
              ) : (
                <><InfoRow n="I">두 분 모두 OK해야 연락처가 열립니다. 한쪽 의도만으로는 매칭되지 않아요.</InfoRow><InfoRow n="II">{nickname} 님이 답하면 알림으로 알려드려요. 그 알림에서 매칭 지면으로 들어갑니다.</InfoRow><InfoRow n="III">24시간 안에 답이 없으면 자동으로 종료돼요. 내일 정오, 새 지면이 도착합니다.</InfoRow></>
              )}
            </div>
          </>
        ) : (
          <div className={styles.error} data-testid="ok-sent-recipient-error">
            <p className={styles.kicker}>RECIPIENT NOT FOUND</p>
            <h1 className={styles.title}>전송한 상대 정보를<br />불러오지 못했어요</h1>
            <p>{refreshFailed ? '전송 결과는 유지됩니다. 이전 화면으로 돌아가 다시 확인해 주세요.' : '상대 정보를 확인하고 있어요.'}</p>
          </div>
        )}
        </div>

        <button type="button" className={styles.cta} data-testid={isMatched ? 'ok-sent-notifications-cta' : 'ok-sent-home-cta'} onClick={() => router.replace(isMatched ? '/notifications' : '/home')}>{isMatched ? '알림에서 확인' : '홈으로 돌아가기'}</button>
        {isRejected && <button type="button" className={styles.ghostCta} onClick={() => router.replace('/history')}>지난 지면 다시 읽기</button>}
      </div>
    </section>
  );
}

function InfoRow({ n, children }: { n: string; children: ReactNode }) {
  return <div className={styles.infoRow}><b>{n}</b><p>{children}</p></div>;
}
