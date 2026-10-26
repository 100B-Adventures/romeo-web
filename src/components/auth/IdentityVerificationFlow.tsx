'use client';

import { useRef, useState } from 'react';
import { authApi, type IdentityStartResponse, type IdentityStatusResponse } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { canRetryIdentityVerification, trustedIdentityHandoff, viewForIdentityStatus, type IdentityView } from '@/lib/identityVerification';
import { IdvBlockedScreen } from './IdvBlockedScreen';
import { IdvCarrierScreen } from './IdvCarrierScreen';
import { IdvProgressScreen } from './IdvProgressScreen';
import { IdvResultScreen } from './IdvResultScreen';

export interface IdentityVerificationFlowProps {
  sessionId: string;
  onBack: () => void;
  onRestart: () => void | Promise<void>;
  onVerified: (signupTicket: string) => void;
  onSupport: () => void;
  continueLabel?: string;
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
    providerWindow.document.location.replace(trustedHandoff);
    providerWindow.opener = null;
  } catch {
    providerWindow.close();
  }
}

export function IdentityVerificationFlow({
  sessionId,
  onBack,
  onRestart,
  onVerified,
  onSupport,
  continueLabel,
}: IdentityVerificationFlowProps) {
  const [view, setView] = useState<'carrier' | IdentityView>('carrier');
  const [start, setStart] = useState<IdentityStartResponse | null>(null);
  const [result, setResult] = useState<IdentityStatusResponse | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [retryError, setRetryError] = useState('');
  const restartingRef = useRef(false);

  const handleStarted = (response: IdentityStartResponse) => {
    setStart(response);
    setView('progress');
  };

  const handleResolved = (response: IdentityStatusResponse) => {
    setResult(response);
    setView(viewForIdentityStatus(response.status));
  };

  const retry = async () => {
    if (!result || !canRetryIdentityVerification(result) || retrying) return;
    // 재시도도 사용자 클릭의 transient activation 안에서 창을 선개방한다.
    const providerWindow = openProviderWindow();
    setRetrying(true);
    setRetryError('');
    try {
      const response = await authApi.retryIdentityVerification(sessionId);
      finishProviderHandoff(providerWindow, response.handoff);
      setStart((current) => ({
        status: 'PENDING',
        pollAfterMs: response.pollAfterMs ?? current?.pollAfterMs ?? 2000,
        expiresAt: response.expiresAt ?? current?.expiresAt ?? new Date().toISOString(),
        handoff: response.handoff,
      }));
      setResult(null);
      setView('progress');
    } catch (reason) {
      providerWindow?.close();
      setRetryError(getErrorMessage(reason));
    } finally {
      setRetrying(false);
    }
  };

  const restart = async () => {
    if (restartingRef.current) return;
    restartingRef.current = true;
    setRestarting(true);
    try {
      await onRestart();
    } finally {
      restartingRef.current = false;
      setRestarting(false);
    }
  };

  if (view === 'progress' && start) {
    return (
      <IdvProgressScreen
        sessionId={sessionId}
        expiresAt={start.expiresAt}
        pollAfterMs={start.pollAfterMs}
        handoff={start.handoff}
        onResolved={handleResolved}
        restarting={restarting}
        onChooseCarrier={() => void restart()}
      />
    );
  }

  if (view === 'blocked' && result) {
    return <IdvBlockedScreen message={result.block?.message} adultAt={result.block?.adultAt} onSupport={onSupport} />;
  }

  if (view === 'result' && result) {
    return (
      <IdvResultScreen
        result={result}
        retrying={retrying}
        restarting={restarting}
        retryError={retryError}
        onContinue={onVerified}
        continueLabel={continueLabel}
        onRetry={() => void retry()}
        onRestart={() => void restart()}
        onSupport={onSupport}
      />
    );
  }

  return <IdvCarrierScreen sessionId={sessionId} onBack={onBack} onStarted={handleStarted} />;
}
