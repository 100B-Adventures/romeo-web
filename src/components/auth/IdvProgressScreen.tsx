'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { authApi, type IdentityStatusResponse } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import {
  formatIdentityCountdown,
  identitySecondsRemaining,
  trustedIdentityHandoff,
  viewForIdentityStatus,
} from '@/lib/identityVerification';
import styles from './IdentityVerification.module.css';

function ShieldIcon() {
  return (
    <svg className={styles.stateIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5c0 4.7-2.8 8.3-7 10-4.2-1.7-7-5.3-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export interface IdvProgressScreenProps {
  sessionId: string;
  expiresAt: string;
  pollAfterMs: number;
  handoff?: string;
  onResolved: (response: IdentityStatusResponse) => void;
  restarting: boolean;
  onChooseCarrier: () => void;
}

export function IdvProgressScreen({
  sessionId,
  expiresAt,
  pollAfterMs,
  handoff,
  onResolved,
  restarting,
  onChooseCarrier,
}: IdvProgressScreenProps) {
  const [remaining, setRemaining] = useState(() => identitySecondsRemaining(expiresAt));
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const checkingRef = useRef(false);

  useEffect(() => {
    const update = () => setRemaining(identitySecondsRemaining(expiresAt));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const checkStatus = useCallback(async (showError: boolean) => {
    if (!sessionId || checkingRef.current) return;
    checkingRef.current = true;
    setChecking(true);
    if (showError) setError('');
    try {
      const response = await authApi.getIdentityVerification(sessionId);
      if (viewForIdentityStatus(response.status) !== 'progress') onResolved(response);
    } catch (reason) {
      if (showError) setError(getErrorMessage(reason));
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, [onResolved, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const interval = Math.max(1000, pollAfterMs || 2000);
    const timer = window.setInterval(() => { void checkStatus(false); }, interval);
    return () => window.clearInterval(timer);
  }, [checkStatus, pollAfterMs, sessionId]);

  const reopenHandoff = () => {
    const trustedHandoff = trustedIdentityHandoff(handoff);
    if (trustedHandoff) {
      window.open(trustedHandoff, '_blank', 'noopener,noreferrer');
      return;
    }
    void checkStatus(true);
  };

  return (
    <section className={styles.stateScreen} data-testid="idv-progress-screen" data-idv-screen>
      <div className={styles.stateBody}>
        <div className={styles.stateSeal}><ShieldIcon /></div>
        <h2 className={styles.stateTitle}>본인확인 창에서<br />인증을 마쳐주세요</h2>
        <div className={styles.timer} aria-label={`남은 시간 ${formatIdentityCountdown(remaining)}`}>
          {formatIdentityCountdown(remaining)}
        </div>
        <p className={styles.stateDescription}>남은 시간 안에 마치지 않으면 처음부터 다시 해야 해요.</p>
        <div className={styles.steps}>
          {[
            '본인확인 앱(PASS)이 열리면 비밀번호나 생체인증으로 잠금을 풀어주세요.',
            '앱이 없으면 문자로 받은 인증번호를 그 창에 넣으시면 됩니다.',
            '확인이 끝나면 큐피드로 자동으로 돌아옵니다.',
          ].map((step, index) => (
            <div className={styles.step} key={step}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <button type="button" className={styles.statePrimary} onClick={() => void checkStatus(true)} disabled={!sessionId || checking}>
          {checking ? '결과를 확인하고 있어요' : '인증을 마쳤어요'}
        </button>
        <button type="button" className={styles.stateGhost} onClick={reopenHandoff} disabled={checking}>
          인증 문자 다시 받기
        </button>
        <button type="button" className={styles.stateGhost} onClick={onChooseCarrier} disabled={checking || restarting}>
          {restarting ? '새 본인확인을 여는 중입니다' : '그만두고 통신사 다시 고르기'}
        </button>
      </div>
    </section>
  );
}
