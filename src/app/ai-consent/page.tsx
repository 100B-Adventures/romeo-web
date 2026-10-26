'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AiConsentDecision,
  AiConsentState,
  aiConsentNotice,
  aiConsentApi,
  createAiConsentIdempotencyKey,
  safeAiConsentReturnTo,
} from '@/lib/api/aiConsent';
import { getErrorMessage } from '@/lib/utils/errorHandler';

const SHARED_FIELDS = ['공통 취미', '생활권', 'MBTI', '결혼 계획', '자녀 계획', '음주', '흡연'];
const EXCLUDED_FIELDS = ['이름·연락처', '사진·정확한 위치', '직장·소득·자산', '인증 자료', '종교'];

function statusLabel(status: AiConsentState['status']) {
  if (status === 'GRANTED') return '동의함';
  if (status === 'DECLINED') return '동의하지 않음';
  if (status === 'WITHDRAWN') return '철회함';
  if (status === 'RECONSENT_REQUIRED') return '재동의 필요';
  return '아직 선택하지 않음';
}

function formatTime(value: string | null) {
  if (!value) return '기록 없음';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('ko-KR');
}

export default function AiConsentPage() {
  return <Suspense fallback={<LoadingState />}><AiConsentContent /></Suspense>;
}

function AiConsentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const settingsMode = searchParams.get('mode') === 'settings';
  const returnTo = safeAiConsentReturnTo(searchParams.get('returnTo'));
  const [state, setState] = useState<AiConsentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const decisionRequest = useRef<{ decision: AiConsentDecision; key: string } | null>(null);
  const withdrawalKey = useRef<string | null>(null);

  const loadState = () => {
    setLoading(true);
    setError('');
    aiConsentApi.getState()
      .then(setState)
      .catch((cause) => setError(getErrorMessage(cause)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadState(); }, []);

  const decide = async (decision: AiConsentDecision) => {
    if (saving || !state || state.noticeVersion !== aiConsentNotice(state.provider).version) return;
    setSaving(true);
    setError('');
    try {
      if (decisionRequest.current?.decision !== decision) {
        decisionRequest.current = { decision, key: createAiConsentIdempotencyKey() };
      }
      const next = await aiConsentApi.decide(decision, state.noticeVersion, decisionRequest.current.key);
      decisionRequest.current = null;
      setState(next);
      if (!settingsMode) router.replace(returnTo);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async () => {
    if (saving || !window.confirm('AI 추천 동의를 철회할까요? 오늘 이미 받은 추천은 유지됩니다.')) return;
    setSaving(true);
    setError('');
    try {
      withdrawalKey.current ??= createAiConsentIdempotencyKey();
      setState(await aiConsentApi.withdraw(withdrawalKey.current));
      withdrawalKey.current = null;
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  if (error && !state) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--cupid-idv-bg)] px-5 text-center text-[var(--cupid-idv-text)]">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-2xl">동의 상태를 확인하지 못했어요</h1>
          <p role="alert" className="mt-3 text-base leading-7 text-[var(--cupid-idv-text-2)]">{error}</p>
          <button type="button" onClick={loadState} className="mt-6 min-h-14 w-full bg-[var(--cupid-idv-accent)] px-5 font-bold text-white active:opacity-70" data-testid="ai-consent-retry">다시 시도</button>
          {settingsMode && <button type="button" onClick={() => router.back()} className="mt-3 min-h-11 font-bold text-[var(--cupid-idv-accent)]">설정으로 돌아가기</button>}
        </div>
      </main>
    );
  }

  const granted = state?.status === 'GRANTED';
  const notice = aiConsentNotice(state?.provider);
  const currentNotice = state?.noticeVersion === notice.version;
  const continueWithRules = () => {
    if (settingsMode) {
      router.back();
      return;
    }
    const separator = returnTo.includes('?') ? '&' : '?';
    router.replace(`${returnTo}${separator}aiConsentFallback=rules`);
  };

  return (
    <main className="min-h-screen bg-[var(--cupid-idv-bg)] px-5 pb-12 pt-6 text-[var(--cupid-idv-text)]" data-testid="ai-consent-page">
      <div className="mx-auto max-w-2xl">
        <header className="flex min-h-11 items-center justify-between">
          <button type="button" onClick={() => router.back()} className="min-h-11 min-w-11 text-left text-2xl active:opacity-70" aria-label="뒤로 가기">‹</button>
          <p className="text-sm font-semibold">{settingsMode ? 'AI 추천 정보 처리' : '선택적 동의'}</p>
          <span className="min-w-11" />
        </header>

        <p className="mt-8 text-sm font-extrabold tracking-[0.24em] text-[var(--cupid-idv-accent)]">CUPID RECOMMENDATION</p>
        <h1 className="mt-4 font-serif text-[2rem] leading-[1.35]">큐피드의 AI 추천을<br />이용할까요?</h1>
        <p className="mt-4 text-base leading-7 text-[var(--cupid-idv-text-2)]">{notice.providerName}의 AI가 두 사람의 공통점을 읽고 오늘의 후보 선정과 추천 이유 생성을 보조합니다.</p>

        {settingsMode && state && (
          <section className="mt-7 space-y-3 rounded-[2px] border border-[var(--cupid-idv-border)] bg-[var(--cupid-idv-surface)] p-5" data-testid="ai-consent-status-card">
            <StatusRow label="현재 상태" value={statusLabel(state.status)} emphasized={granted} />
            <StatusRow label="고지 버전" value={state.noticeVersion} />
            <StatusRow label={granted ? '동의 시각' : '변경 시각'} value={formatTime(granted ? state.decidedAt : state.withdrawnAt || state.decidedAt)} />
          </section>
        )}

        <div className="mt-7 divide-y divide-[var(--cupid-idv-border)] border-y border-[var(--cupid-idv-border)]">
          <Info title="누가, 어디에서 처리하나요?">제공자는 {notice.providerName}입니다. 입력과 결과는 국외, 미국에서 처리·보관될 수 있으며 HTTPS로 암호화해 전송합니다. 표준 API 보관 기간은 최대 30일이고 법적·안전상 예외가 있을 수 있습니다. API 입력·출력은 기본적으로 모델 학습에 사용되지 않습니다.</Info>
          <Info title="동의 기록 기준 고지문">{notice.canonicalNotice}</Info>
          <ChipInfo title="전송하는 정보" items={SHARED_FIELDS} />
          <ChipInfo title="전송하지 않는 정보" items={EXCLUDED_FIELDS} />
          <Info title="이용 목적">회원이 추천을 받을 때와 다른 회원의 후보로 검토될 때, 공통점과 생활 적합성을 분석해 후보 선정에 참고합니다.</Info>
          <Info title="선택하지 않아도 이용할 수 있어요">동의하지 않거나 나중에 철회해도 규칙 기반 추천은 계속 이용할 수 있습니다. AI 전송에는 종교를 포함하지 않습니다.</Info>
        </div>

        <Link href="/privacy" className="mt-5 inline-flex min-h-11 items-center font-bold text-[var(--cupid-idv-accent)] active:opacity-70">개인정보처리방침 전문 보기 →</Link>
        {error && <p role="alert" className="mt-4 text-sm text-[var(--cupid-idv-danger)]">{error}</p>}

        {!currentNotice ? (
          <section className="mt-6 rounded-[2px] border border-[var(--cupid-idv-border)] p-5" data-testid="ai-consent-update-required">
            <h2 className="font-bold">최신 고지문을 불러오려면 앱을 업데이트해 주세요</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--cupid-idv-text-2)]">현재 화면의 고지 버전과 서버 버전이 달라 선택을 저장하지 않았습니다. 규칙 기반 추천은 계속 이용할 수 있습니다.</p>
            <button type="button" onClick={continueWithRules} className="mt-5 min-h-14 w-full border border-[var(--cupid-idv-accent)] px-5 text-sm font-bold text-[var(--cupid-idv-accent)] active:opacity-70" data-testid="ai-consent-continue-rules">규칙 추천 계속 이용</button>
          </section>
        ) : settingsMode && granted ? (
          <button type="button" onClick={withdraw} disabled={saving} className="mt-6 min-h-14 w-full border border-[var(--cupid-idv-danger)] px-5 text-sm font-bold text-[var(--cupid-idv-danger)] active:opacity-70 disabled:opacity-50" data-testid="ai-consent-withdraw">AI 추천 동의 철회</button>
        ) : (
          <div className="mt-6 grid gap-2">
            <button type="button" onClick={() => decide('GRANTED')} disabled={saving} className="min-h-14 border border-[var(--cupid-idv-accent)] bg-[var(--cupid-idv-surface)] px-5 text-sm font-bold text-[var(--cupid-idv-accent)] active:opacity-70 disabled:opacity-50" data-testid="ai-consent-grant">AI 추천에 동의하고 계속</button>
            {!settingsMode && <button type="button" onClick={() => decide('DECLINED')} disabled={saving} className="min-h-14 border border-[var(--cupid-idv-accent)] bg-white px-5 text-sm font-bold text-[var(--cupid-idv-accent)] active:opacity-70 disabled:opacity-50" data-testid="ai-consent-decline">동의하지 않고 규칙 추천 이용</button>}
          </div>
        )}
      </div>
    </main>
  );
}

function LoadingState() {
  return <div className="grid min-h-screen place-items-center bg-[var(--cupid-idv-bg)]"><p className="text-base text-[var(--cupid-idv-text-2)]">동의 상태를 확인하고 있어요</p></div>;
}

function StatusRow({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return <div className="flex items-start justify-between gap-4 text-sm"><span className="text-[var(--cupid-idv-text-2)]">{label}</span><span className={emphasized ? 'text-right font-bold text-[var(--cupid-idv-ok)]' : 'text-right font-medium'}>{value}</span></div>;
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="py-5"><h2 className="text-base font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--cupid-idv-text-2)]">{children}</p></section>;
}

function ChipInfo({ title, items }: { title: string; items: string[] }) {
  return <section className="py-5"><h2 className="text-base font-bold">{title}</h2><div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <span key={item} className="rounded-[2px] border border-[var(--cupid-idv-border)] bg-[var(--cupid-idv-accent-soft)] px-3 py-2 text-sm font-semibold">{item}</span>)}</div></section>;
}
