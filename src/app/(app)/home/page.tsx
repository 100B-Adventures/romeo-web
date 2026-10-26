'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { matchingApi, ProfileCardResponse, recommendationApi, TodayRecommendationResponse } from '@/lib/api/matching';
import { getErrorMessage, getHeartInsufficientDetails, type HeartInsufficientDetails } from '@/lib/utils/errorHandler';
import { useUIStore } from '@/store/uiStore';
import { TodayHeroCard } from '@/components/cupid/TodayHeroCard';
import HeartInsufficientDialog from '@/components/common/HeartInsufficientDialog';
import { aiConsentApi, requiresAiConsentDecision } from '@/lib/api/aiConsent';
import { buildOkSentHref } from '@/lib/okSentRoute';
import { useAuthStore } from '@/store/authStore';
import { recoverFromAuthRefreshFailure, refreshCurrentAuthSession } from '@/lib/api/client';
import { getHomeEmptyCopy } from '@/lib/homeEmptyState';
import { EmptyTodayCard } from '@/components/cupid/EmptyTodayCard';

type LikeState = { sentLike?: 'OK' | 'SUPER_OK'; matched?: boolean };
const PENDING_STATUS_SYNC_COOLDOWN_MS = 60_000;

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const push = router.push;
  const replace = router.replace;
  const allowRuleFallback = searchParams.get('aiConsentFallback') === 'rules';
  const showToast = useUIStore((state) => state.showToast);
  const userStatus = useAuthStore((state) => state.user?.status);
  const userId = useAuthStore((state) => state.user?.userId ?? null);
  const authGeneration = useAuthStore((state) => state.authGeneration);
  const lastPendingStatusSyncRef = useRef<{ userId: number | null; at: number }>({ userId: null, at: 0 });
  const [recommendation, setRecommendation] = useState<TodayRecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusSyncError, setStatusSyncError] = useState('');
  const [statusSyncing, setStatusSyncing] = useState(false);
  const [likeState, setLikeState] = useState<LikeState>({});
  const [heartInsufficient, setHeartInsufficient] = useState<HeartInsufficientDetails | null>(null);

  const fetchRecommendation = useCallback(async (forceStatusSync = false) => {
    if (userStatus === 'PENDING_APPROVAL') {
      const owner = lastPendingStatusSyncRef.current;
      if (!forceStatusSync && owner.userId === userId && Date.now() - owner.at < PENDING_STATUS_SYNC_COOLDOWN_MS) return;
      lastPendingStatusSyncRef.current = { userId, at: Date.now() };
      setStatusSyncing(true);
      setStatusSyncError('');
      try {
        await refreshCurrentAuthSession();
      } catch (refreshError) {
        const recovery = await recoverFromAuthRefreshFailure(refreshError, authGeneration);
        if (recovery === 'logged-out') replace('/login');
        if (recovery === 'session-kept') {
          setStatusSyncError('승인 상태를 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
        }
      } finally {
        setStatusSyncing(false);
      }
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      if (!allowRuleFallback) {
        try {
          const consent = await aiConsentApi.getState();
          if (requiresAiConsentDecision(consent.status)) {
            push('/ai-consent?returnTo=%2Fhome');
            return;
          }
        } catch {
          // 동의 상태 조회 장애 때 추천 서버가 외부 AI 호출을 fail-closed로 막고 규칙 추천을 제공한다.
        }
      }
      const nextRecommendation = await recommendationApi.getTodayRecommendations();
      if (nextRecommendation.adultDeclarationRequired) {
        replace('/adult-declaration');
        return;
      }
      setRecommendation(nextRecommendation);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [allowRuleFallback, authGeneration, push, replace, userId, userStatus]);

  useEffect(() => { fetchRecommendation(); }, [fetchRecommendation]);
  useEffect(() => {
    const onFocus = () => {
      if (userStatus === 'PENDING_APPROVAL') void fetchRecommendation();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchRecommendation, userStatus]);

  const pick = useMemo(() => {
    const active = recommendation?.slots.find((slot) => slot.active && (slot.profiles?.length ?? 0) > 0);
    const fallback = recommendation?.slots.find((slot) => !slot.upcoming && (slot.profiles?.length ?? 0) > 0);
    const slot = active ?? fallback;
    const profile = slot?.profiles?.[0] ?? null;
    return profile ? { profile, cupidReason: slot?.cupidReason ?? undefined, matchScore: slot?.matchScore ?? undefined } : null;
  }, [recommendation]);

  const openProfile = (profile: ProfileCardResponse) => {
    const params = new URLSearchParams({ source: 'home' });
    if (likeState.sentLike) { params.set('alreadyLiked', 'true'); params.set('likeType', likeState.sentLike); }
    if (likeState.matched) params.set('matched', 'true');
    push(`/profiles/${profile.profileId}?${params.toString()}`);
  };

  const send = async (profile: ProfileCardResponse, likeType: 'OK' | 'SUPER_OK') => {
    try {
      const result = await matchingApi.sendLike({ targetProfileId: profile.profileId, likeType });
      setLikeState({ sentLike: likeType, matched: result.matched });
      if (result.matched) {
        showToast('매칭이 성사되었습니다. 히스토리에서 연락처를 확인하세요.');
      } else {
        router.replace(buildOkSentHref(result));
      }
    } catch (err) {
      const shortage = getHeartInsufficientDetails(err);
      if (shortage) setHeartInsufficient(shortage);
      else showToast(getErrorMessage(err));
    }
  };

  if (userStatus === 'PENDING_APPROVAL') {
    return <PendingApprovalState error={statusSyncError} refreshing={statusSyncing} onRefresh={() => { void fetchRecommendation(true); }} />;
  }
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => { void fetchRecommendation(true); }} />;
  if (!pick && recommendation) {
    const emptyCopy = getHomeEmptyCopy(recommendation);
    return <EmptyTodayCard copy={emptyCopy} onAction={(route) => push(route)} />;
  }
  if (!pick) return <LoadingState />;

  return (
    <div className="bg-[var(--cupid-idv-bg)] lg:grid lg:grid-cols-[20rem_minmax(0,1fr)]" data-testid="home-single-curation">
      <aside className="hidden border-r border-[var(--cupid-idv-border)] p-8 lg:block">
        <p className="text-[10px] font-extrabold tracking-[0.18em] text-[var(--cupid-idv-gold)]">TODAY · 오늘</p>
        <h2 className="mt-4 font-serif text-3xl text-[var(--cupid-idv-text)]">오늘의 한 분, {pick.profile.nickname}</h2>
        <p className="mt-6 text-sm leading-[1.7] text-[var(--cupid-idv-text-2)]">하루 한 사람을 깊이 읽을 수 있도록 큐피드가 이유와 함께 골랐습니다.</p>
      </aside>
      <TodayHeroCard profileId={pick.profile.profileId} userId={pick.profile.userId}
        photoUrl={pick.profile.photoUrls?.[0]} nickname={pick.profile.nickname} age={pick.profile.age}
        locationCity={pick.profile.location} height={pick.profile.height} bodyType={pick.profile.bodyType}
        religion={pick.profile.religion} jobTitle={pick.profile.occupation} company={pick.profile.company}
        education={pick.profile.education} school={pick.profile.school} incomeRange={pick.profile.incomeRange}
        verifiedBadges={pick.profile.verificationBadges} identityVerified={pick.profile.identityVerified}
        matchScore={pick.matchScore ?? undefined} cupidReason={pick.cupidReason ?? undefined}
        sentLike={likeState.sentLike ?? (pick.profile.alreadyLiked ? 'OK' : undefined)} matched={likeState.matched}
        onOpen={() => openProfile(pick.profile)} onOk={() => send(pick.profile, 'OK')} onSuperOk={() => send(pick.profile, 'SUPER_OK')} />
      <HeartInsufficientDialog
        details={heartInsufficient}
        onClose={() => setHeartInsufficient(null)}
        onCharge={() => {
          setHeartInsufficient(null);
          push('/payment');
        }}
      />
    </div>
  );
}

function LoadingState() {
  return <div className="grid min-h-[60vh] place-items-center" data-testid="home-loading"><p className="text-sm text-[var(--cupid-idv-text-2)]">큐피드가 오늘의 한 분을 고르는 중입니다.</p></div>;
}

function PendingApprovalState({ error, refreshing, onRefresh }: { error: string; refreshing: boolean; onRefresh: () => void }) {
  return <div className="grid min-h-[60vh] place-items-center px-6 text-center" data-testid="home-pending-approval"><div><p className="font-serif text-2xl text-[var(--cupid-idv-text)]">프로필을 심사하고 있어요</p><p className="mt-4 text-sm leading-[1.7] text-[var(--cupid-idv-text-2)]">승인 전에는 오늘의 추천이 준비되지 않습니다. 심사가 끝나면 알림으로 알려드릴게요.</p>{error ? <p className="mt-4 text-sm text-[var(--cupid-idv-danger)]" role="alert">{error}</p> : null}<button className="mt-6 border border-[var(--cupid-idv-accent)] px-5 py-3 text-sm font-bold text-[var(--cupid-idv-accent)] disabled:opacity-60" onClick={onRefresh} disabled={refreshing}>{refreshing ? '승인 상태 확인 중' : '승인 상태 새로고침'}</button></div></div>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="grid min-h-[60vh] place-items-center px-6 text-center" data-testid="home-error"><div><p className="text-sm text-[var(--cupid-idv-danger)]">{message}</p><p className="mt-3 text-xs text-[var(--cupid-idv-text-2)]">이미 보낸 OK는 보존됩니다.</p><button className="mt-6 border border-[var(--cupid-idv-accent)] px-5 py-3 text-sm font-bold text-[var(--cupid-idv-accent)]" onClick={onRetry}>다시 불러오기</button></div></div>;
}
