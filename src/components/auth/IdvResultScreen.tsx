'use client';

import type { IdentityStatusResponse } from '@/lib/api/auth';
import { canRetryIdentityVerification, shouldRestartIdentityVerification } from '@/lib/identityVerification';
import styles from './IdentityVerification.module.css';

function StatusIcon({ success }: { success: boolean }) {
  return success ? (
    <svg className={styles.stateIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg className={styles.stateIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5c0 4.7-2.8 8.3-7 10-4.2-1.7-7-5.3-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export interface IdvResultScreenProps {
  result: IdentityStatusResponse;
  retrying: boolean;
  restarting: boolean;
  retryError?: string;
  onContinue: (signupTicket: string) => void;
  onRetry: () => void;
  onRestart: () => void;
  onSupport: () => void;
  continueLabel?: string;
}

const FALLBACK_FAILURE_COPY = '확인이 끝나지 않았어요. 아래 내용을 보시고 다시 시도해 주세요.';

export function IdvResultScreen({
  result,
  retrying,
  restarting,
  retryError,
  onContinue,
  onRetry,
  onRestart,
  onSupport,
  continueLabel = '큐피드 인터뷰 시작하기',
}: IdvResultScreenProps) {
  const success = result.status === 'SUCCEEDED' && Boolean(result.signupTicket);
  const structural = result.failureCategory === 'STRUCTURAL';
  const retryAllowed = canRetryIdentityVerification(result);
  const restartRequired = shouldRestartIdentityVerification(result);

  return (
    <section className={styles.stateScreen} data-testid="idv-result-screen" data-idv-screen>
      <div className={styles.stateBody}>
        <div className={`${styles.stateSeal} ${success ? styles.stateSealSuccess : styles.stateSealFailure}`}>
          <StatusIcon success={success} />
        </div>
        <h2 className={styles.stateTitle}>
          {success ? <>만 19세 이상이<br />확인되었습니다</> : <>본인확인이<br />되지 않았어요</>}
        </h2>
        <p className={styles.stateDescription}>
          {success ? (
            <>이름·생년월일 원본·CI는 <strong className={styles.strong}>저장하지 않습니다.</strong> 본인확인 세션에는 세션 식별값, 전화번호 해시·암호문, 통신사, 확인 사업자·요청번호, 처리 상태·시도 횟수, 생성·수정·만료 시각을 저장합니다. 처리 결과에 따라 실패 사유, 성인 여부·도달일, DI 해시·1회용 가입표도 저장하며, 세션은 생성 후 90일이 지난 다음 정리 시 삭제합니다. 회원 식별값과 연결된 만 19세 이상 여부·확인 시각·확인 사업자·DI 해시는 별도 자동 파기 기한 없이 보관하며, 회원 계정이 물리 삭제될 때 함께 삭제됩니다. 이제 큐피드가 인터뷰를 시작할게요.</>
          ) : (result.failureMessage || FALLBACK_FAILURE_COPY)}
        </p>

        {!success && structural && result.failureNextAction ? (
          <div className={styles.nextAction}>
            <div className={styles.nextActionKicker}>이렇게 하시면 됩니다</div>
            <p className={styles.nextActionText}>{result.failureNextAction}</p>
          </div>
        ) : null}

        {!success && !structural ? (
          <div className={styles.causes}>
            <p className={styles.cause}><strong className={styles.strong}>휴대폰 명의가 본인이 아닐 때</strong> 가족 명의라면 명의자 본인만 확인할 수 있어요.</p>
            <p className={styles.cause}><strong className={styles.strong}>고른 통신사가 다를 때</strong> 알뜰폰은 알뜰폰 항목을 골라야 해요.</p>
            <p className={styles.cause}><strong className={styles.strong}>본인확인 앱이 없을 때</strong> 앱 대신 문자 인증으로도 진행할 수 있습니다.</p>
          </div>
        ) : null}

        {retryError ? <p className={styles.error} role="alert">{retryError}</p> : null}
        {success ? (
          <button type="button" className={styles.statePrimary} onClick={() => onContinue(result.signupTicket!)}>
            {continueLabel}
          </button>
        ) : (
          <>
            {restartRequired ? (
              <button type="button" className={styles.statePrimary} onClick={onRestart} disabled={restarting}>
                {restarting
                  ? '새 본인확인을 여는 중입니다'
                  : result.failureCode === 'CARRIER_MISMATCH'
                    ? '통신사 다시 고르고 시도하기'
                    : '새 본인확인 시작하기'}
              </button>
            ) : retryAllowed ? (
              <button type="button" className={styles.statePrimary} onClick={onRetry} disabled={retrying}>
                {retrying ? '다시 여는 중입니다' : '다시 시도하기'}
              </button>
            ) : null}
            <button type="button" className={structural ? styles.statePrimary : styles.stateGhost} onClick={onSupport}>
              {structural ? '고객센터에 문의하기' : '그래도 안 되면 고객센터에 문의하기'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
