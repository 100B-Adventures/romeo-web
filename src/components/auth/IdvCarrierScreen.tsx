'use client';

import { useMemo, useState } from 'react';
import { authApi, type IdentityCarrier, type IdentityStartResponse } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { hasExactRequiredTerms, trustedIdentityHandoff, WEB_IDV_REQUIRED_TERMS } from '@/lib/identityVerification';
import styles from './IdentityVerification.module.css';

const CARRIERS: ReadonlyArray<{ id: IdentityCarrier; name: string; description: string }> = [
  { id: 'SKT', name: 'SKT', description: 'SK텔레콤' },
  { id: 'KT', name: 'KT', description: '케이티' },
  { id: 'LGU', name: 'LG U+', description: 'LG유플러스' },
  { id: 'MVNO', name: '알뜰폰', description: 'SKT·KT·LGU+ 망' },
];

const TERMS = [
  { id: WEB_IDV_REQUIRED_TERMS[0], label: '개인정보 수집 및 이용 동의' },
  { id: WEB_IDV_REQUIRED_TERMS[1], label: '고유식별정보 처리 동의' },
  { id: WEB_IDV_REQUIRED_TERMS[2], label: '통신사 본인확인 서비스 이용약관' },
  { id: WEB_IDV_REQUIRED_TERMS[3], label: '본인확인기관에 정보 제공 동의' },
] as const;

function ShieldIcon() {
  return (
    <svg className={styles.shield} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5c0 4.7-2.8 8.3-7 10-4.2-1.7-7-5.3-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return <span className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''}`} aria-hidden="true">✓</span>;
}

export interface IdvCarrierScreenProps {
  sessionId: string;
  onBack: () => void;
  onStarted: (response: IdentityStartResponse) => void;
}

function openProviderWindow(): Window | null {
  return window.open('about:blank', '_blank', 'popup');
}

function finishProviderHandoff(providerWindow: Window | null, handoff?: string) {
  if (!providerWindow) return;
  const trustedHandoff = trustedIdentityHandoff(handoff);
  if (!trustedHandoff) {
    providerWindow.close();
    return;
  }

  try {
    // WindowProxy.location 대입은 일부 브라우저에서 opener 분리와 경합한다.
    // 아직 same-origin인 about:blank 문서가 자기 자신을 이동하게 한다.
    providerWindow.document.location.replace(trustedHandoff);
    // 이동 예약 뒤 about:blank가 아직 same-origin일 때 역탭내빙 통로를 끊는다.
    providerWindow.opener = null;
  } catch {
    providerWindow.close();
  }
}

export function IdvCarrierScreen({ sessionId, onBack, onStarted }: IdvCarrierScreenProps) {
  const [carrier, setCarrier] = useState<IdentityCarrier | null>(null);
  const [agreements, setAgreements] = useState<Set<string>>(() => new Set());
  const [whyOpen, setWhyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const selectedTerms = useMemo(() => [...agreements], [agreements]);
  const allAgreed = hasExactRequiredTerms(selectedTerms);
  const ready = Boolean(sessionId && carrier && allAgreed);

  const toggleAll = () => {
    setAgreements(allAgreed ? new Set() : new Set(WEB_IDV_REQUIRED_TERMS));
  };

  const toggleTerm = (term: string) => {
    setAgreements((current) => {
      const next = new Set(current);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  };

  const start = async () => {
    if (!ready || !carrier || submitting) return;
    // 팝업 차단기가 허용하는 클릭 동기 구간에서 빈 창을 먼저 연다.
    const providerWindow = openProviderWindow();
    setSubmitting(true);
    setError('');
    try {
      const response = await authApi.startIdentityVerification(sessionId, carrier, selectedTerms);
      finishProviderHandoff(providerWindow, response.handoff);
      onStarted(response);
    } catch (reason) {
      providerWindow?.close();
      setError(getErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  };

  const need = !carrier
    ? '통신사를 먼저 골라주세요.'
    : !allAgreed
      ? '필수 약관 4건에 모두 동의해야 진행할 수 있어요.'
      : '';

  return (
    <section className={styles.carrierScreen} data-testid="idv-carrier-screen" data-idv-screen>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="이전 화면">‹</button>
        <span className={styles.wordmark}>CUPID</span>
        <span className={styles.folio}>성인 확인</span>
      </header>
      <div className={styles.carrierBody}>
        <div className={styles.carrierIntro}>
          <span className={styles.kicker}>Identity</span>
          <h2 className={styles.title}>만 19세 이상인지<br />확인할게요</h2>
          <div className={styles.trustRow}>
            <ShieldIcon />
            <span>생년월일을 직접 묻지 않습니다. <strong className={styles.strong}>통신사가 확인한 성인 여부만</strong> 받아요.</span>
          </div>
          <button type="button" className={styles.whyButton} onClick={() => setWhyOpen((open) => !open)} aria-expanded={whyOpen}>
            왜 통신사 인증인가요? {whyOpen ? '⌃' : '⌄'}
          </button>
          {whyOpen ? (
            <p className={styles.whyPanel}>큐피드는 결혼을 전제로 한 <strong className={styles.strong}>성인 전용</strong> 서비스입니다. 사용자가 적어 넣은 생년월일은 확인할 방법이 없어 명의자 정보를 가진 통신사에 확인을 맡깁니다. <strong className={styles.strong}>이름과 주민등록번호는 우리 화면에서 받지 않습니다.</strong></p>
          ) : null}
        </div>

        <div className={styles.carrierForm}>
          <div className={styles.sectionTitle}>Carrier · 쓰시는 통신사</div>
          <div className={styles.carrierGrid} role="radiogroup" aria-label="통신사">
            {CARRIERS.map((item) => {
              const selected = carrier === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`${styles.carrierButton} ${selected ? styles.carrierButtonSelected : ''}`}
                  onClick={() => setCarrier(item.id)}
                  role="radio"
                  aria-checked={selected}
                >
                  <span className={styles.carrierName}>{item.name}</span>
                  <span className={styles.carrierDescription}>{item.description}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.sectionTitle}>Terms · 필수 약관 4건</div>
          <div className={styles.agreements}>
            <button type="button" className={styles.agreementAll} onClick={toggleAll} role="checkbox" aria-checked={allAgreed}>
              <Checkbox checked={allAgreed} />
              <span>4건에 모두 동의합니다</span>
            </button>
            {TERMS.map((term) => {
              const checked = agreements.has(term.id);
              return (
                <button
                  type="button"
                  key={term.id}
                  className={styles.agreementRow}
                  onClick={() => toggleTerm(term.id)}
                  role="checkbox"
                  aria-checked={checked}
                >
                  <Checkbox checked={checked} />
                  <span className={styles.agreementLabel}>{term.label}</span>
                  <span className={styles.required}>필수</span>
                </button>
              );
            })}
          </div>
          <p className={styles.legal}>이름·생년월일 원본·CI는 저장하지 않습니다. 본인확인 세션에는 세션 식별값, 전화번호 해시·암호문, 통신사, 확인 사업자·요청번호, 처리 상태·시도 횟수, 생성·수정·만료 시각을 저장합니다. 처리 결과에 따라 실패 사유, 성인 여부·도달일, DI 해시·1회용 가입표도 저장하며, 세션은 생성 후 90일이 지난 다음 정리 시 삭제합니다. 가입 후에는 <strong className={styles.strong}>회원 식별값과 연결된 만 19세 이상 여부, 확인 시각, 확인 사업자, DI 해시</strong>를 보관합니다. 별도 자동 파기 기한은 없으며, 회원 계정이 물리 삭제될 때 함께 삭제됩니다.</p>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          {!ready && need ? <p className={styles.need}>{need}</p> : null}
          <button type="button" className={styles.primaryButton} onClick={start} disabled={!ready || submitting}>
            {submitting ? '본인확인을 여는 중입니다' : '통신사로 본인확인 시작하기'}
          </button>
        </div>
      </div>
    </section>
  );
}
