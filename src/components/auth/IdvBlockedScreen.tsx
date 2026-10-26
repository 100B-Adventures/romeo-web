'use client';

import styles from './IdentityVerification.module.css';

function ShieldIcon() {
  return (
    <svg className={styles.stateIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5c0 4.7-2.8 8.3-7 10-4.2-1.7-7-5.3-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export interface IdvBlockedScreenProps {
  message?: string;
  adultAt?: string | null;
  onSupport: () => void;
}

export function IdvBlockedScreen({ message, adultAt, onSupport }: IdvBlockedScreenProps) {
  return (
    <section className={styles.stateScreen} data-testid="idv-blocked-screen" data-idv-screen>
      <div className={styles.stateBody}>
        <div className={`${styles.stateSeal} ${styles.stateSealFailure}`}><ShieldIcon /></div>
        <h2 className={styles.stateTitle}>만 19세부터<br />이용할 수 있어요</h2>
        <p className={styles.stateDescription}>
          큐피드는 결혼을 전제로 한 성인 매칭 서비스입니다.{' '}
          {message || '통신사에서 확인된 생년월일 기준으로 만 19세가 되는 날부터 가입하실 수 있어요.'}
        </p>
        <div className={styles.deletedNote}>
          <div className={styles.deletedKicker}>Retention</div>
          <p className={styles.deletedBody}>
            {adultAt ? (
              <>재인증과 중복 시도를 막기 위해 <strong className={styles.strong}>전화번호 해시, 성인 도달일(생년월일에서 도출되어 생년월일과 동등한 정보), 차단 종료일, 차단 시각, 확인 사업자</strong>를 보관하고, 성인 도달일이 지난 뒤 다음 정리 시 삭제합니다.</>
            ) : (
              <>성인 도달일을 확인할 수 없어 <strong className={styles.strong}>전화번호 해시, 차단 종료일, 차단 시각, 확인 사업자</strong>를 보관합니다. 차단은 차단일로부터 90일 뒤 종료되고, 기록은 차단 종료일이 지난 뒤 다음 정리 시 삭제합니다. 성인 도달일은 저장하지 않습니다.</>
            )}{' '}
            본인확인 세션에는 세션 식별값, 전화번호 해시·암호문, 통신사, 확인 사업자·요청번호, 처리 상태·시도 횟수, 미성년 여부, 생성·수정·만료 시각을 저장하고, 생성 후 90일이 지난 다음 정리 시 삭제합니다. 이름·생년월일 원본·CI·DI·1회용 가입표는 저장하지 않습니다.
          </p>
          <div className={styles.deletedSignature}>Cupid</div>
        </div>
        <button type="button" className={styles.stateGhost} onClick={onSupport}>
          확인 결과가 사실과 다르다면 문의하기
        </button>
      </div>
    </section>
  );
}
