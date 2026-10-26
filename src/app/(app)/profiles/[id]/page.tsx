'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { profileApi, ProfileDetailResponse } from '@/lib/api/profile';
import { matchingApi } from '@/lib/api/matching';
import { safetyApi, ReportReason } from '@/lib/api/safety';
import { getErrorMessage, getHeartInsufficientDetails, type HeartInsufficientDetails } from '@/lib/utils/errorHandler';
import CardSettings from '@/components/cards/CardSettings';
import { pricingApi, CurrentPricingResponse } from '@/lib/api/pricing';
import { costPillLabel } from '@/components/cupid/heroCardPricing';
import { ProfileHero } from '@/components/cupid/ProfileHero';
import { AboutPanel, CupidBrandCard, FactFile, NarrativeSections, VerifiedPanel } from '@/components/cupid/ProfileEditorial';
import HeartInsufficientDialog from '@/components/common/HeartInsufficientDialog';
import { buildOkSentHref } from '@/lib/okSentRoute';
import styles from './ProfileDetail.module.css';

/**
 * 상대 프로필 상세 페이지
 * 사진 슬라이더, 기본 정보, 인증 뱃지, 자기소개, 하단 고정 액션 버튼
 */
export default function ProfileDetailPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = Number(params.id);
  const showToast = useUIStore((state) => state.showToast);

  const [profile, setProfile] = useState<ProfileDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPhotoFullscreen, setIsPhotoFullscreen] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const [heartInsufficient, setHeartInsufficient] = useState<HeartInsufficientDetails | null>(null);

  // 신고 모달 상태
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('INAPPROPRIATE_CONTENT');
  const [reportDescription, setReportDescription] = useState('');

  // 발신 요금(회장 결정 18·19·29 — 매칭 전/후 × 성별 4조합). 화면에 숫자를 고정하지 않고
  // /me/pricing 조회 결과만 그린다. 조회 실패·로딩 중에는 값을 알 수 없으므로 발신을 막는다.
  const [pricing, setPricing] = useState<CurrentPricingResponse | null>(null);
  useEffect(() => {
    let cancelled = false;
    pricingApi
      .getCurrentPricing()
      .then((p) => { if (!cancelled) setPricing(p); })
      .catch(() => { if (!cancelled) setPricing(null); });
    return () => { cancelled = true; };
  }, []);

  // 프로필 로드
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await profileApi.getProfileById(profileId);
      setProfile(data);
    } catch (err) {
      const message = getErrorMessage(err);
      setLoadError(message);
      showToast(message);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, showToast]);

  useEffect(() => {
    if (profileId) fetchProfile();
  }, [profileId, fetchProfile]);

  // 좋아요 보내기
  const handleLike = async () => {
    // 요금 조회 실패·로딩 중에는 실제 차감액을 알 수 없으므로 발신을 막는다.
    if (isActioning || !profile || !pricing) {
      if (!pricing) showToast('요금 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setIsActioning(true);
    try {
      const result = await matchingApi.sendLike({
        targetProfileId: profile.profileId,
        likeType: 'OK',
      });
      if (result.matched) {
        showToast('매칭이 성사되었습니다!');
        router.push(`/matchings/${result.matchingId}`);
      } else {
        router.replace(buildOkSentHref(result));
      }
    } catch (err) {
      const shortage = getHeartInsufficientDetails(err);
      if (shortage) {
        setHeartInsufficient(shortage);
      } else {
        showToast(getErrorMessage(err));
      }
    } finally {
      setIsActioning(false);
    }
  };

  // Super OK 보내기
  const handleSuperOk = async () => {
    if (isActioning || !profile || !pricing) {
      if (!pricing) showToast('요금 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setIsActioning(true);
    try {
      const result = await matchingApi.sendLike({
        targetProfileId: profile.profileId,
        likeType: 'SUPER_OK',
      });
      if (result.matched) {
        showToast('매칭이 성사되었습니다!');
        router.push(`/matchings/${result.matchingId}`);
      } else {
        router.replace(buildOkSentHref(result));
      }
    } catch (err) {
      const shortage = getHeartInsufficientDetails(err);
      if (shortage) {
        setHeartInsufficient(shortage);
      } else {
        showToast(getErrorMessage(err));
      }
    } finally {
      setIsActioning(false);
    }
  };

  // 넘기기
  const handlePass = () => {
    router.back();
  };

  // 지인에게 소개
  const handleIntroduce = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Romeo & Cupid 프로필 소개',
        text: `${profile?.nickname}님의 프로필을 확인해보세요!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('프로필 링크가 복사되었습니다.');
    }
  };

  // 삭제(차단)
  const handleDelete = async () => {
    if (!profile) return;
    try {
      await safetyApi.blockUser(profile.userId);
      showToast('해당 사용자를 차단했습니다.');
      router.back();
    } catch (err) {
      showToast(getErrorMessage(err));
    }
  };

  // 신고
  const handleReport = () => {
    setShowReportModal(true);
  };

  // 신고 제출
  const submitReport = async () => {
    if (!profile) return;
    try {
      await safetyApi.createReport({
        reportedUserId: profile.userId,
        reason: reportReason,
        description: reportDescription || undefined,
      });
      showToast('신고가 접수되었습니다.');
      setShowReportModal(false);
      setReportDescription('');
    } catch (err) {
      showToast(getErrorMessage(err));
    }
  };

  // 로딩
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
        <p className="mt-4 text-sm text-subtext dark:text-[var(--subtext)]">프로필을 불러오는 중...</p>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center px-8 text-center" data-testid="detail-error">
        <p className="font-serif text-2xl font-semibold text-text dark:text-dark-cream">프로필을 불러오지 못했어요</p>
        <p className="mt-3 text-sm leading-relaxed text-subtext dark:text-[var(--subtext)]">
          잠시 뒤 다시 시도해 주세요. 이전 화면의 정보는 그대로 보존됩니다.
        </p>
        <div className="mt-8 flex w-full max-w-sm gap-3">
          <button type="button" onClick={fetchProfile} className="min-h-12 flex-1 border border-gold px-4 font-semibold text-gold dark:border-dark-gold dark:text-dark-gold">
            다시 불러오기
          </button>
          <button type="button" onClick={() => router.push('/home')} className="min-h-12 flex-1 bg-wine px-4 font-semibold text-white dark:bg-dark-gold dark:text-dark-bg">
            홈으로
          </button>
        </div>
      </section>
    );
  }

  const photos = profile.photoUrls || [];
  const age = profile.age;
  const facts = [
    ['지역', profile.regionTags?.join(' · ') || profile.location],
    ['직업', profile.occupation],
    ['키', profile.height ? `${profile.height}cm` : undefined],
    ['체형', profile.bodyType],
    ['MBTI', profile.mbti],
    ['종교', profile.religion],
    ['결혼 계획', profile.marriagePlan],
    ['자녀 계획', profile.childPlan],
  ] as const;
  const narratives = [
    ['LIFESTYLE · 라이프스타일', profile.essayLifestyle],
    ['VALUES · 가치관', profile.essayIdealType],
    ['TASTE · 취향', profile.hobbies?.join(' · ')],
  ] as const;

  return (
    <div className={styles.layout}>
      <aside className={styles.rail}>
        <p className={styles.railKicker}>TODAY&apos;S ONE · 오늘의 인물</p>
        <h2 className={styles.railTitle}>{profile.occupation ? `${profile.occupation},` : ''}<br />{profile.nickname} 님의 지면</h2>
        <p className={styles.railBody}>사진과 기본 정보, 큐피드가 다듬은 소개를 순서대로 읽고 마음을 전해 주세요.</p>
        <div className={styles.railDivider} />
        <p className={styles.railKicker}>인증</p>
        <p className={styles.railBody}>표시된 인증은 큐피드가 실제 원본을 확인한 항목만 담습니다.</p>
      </aside>
      <article className={styles.page} data-testid="detail-editorial-page">
      <ProfileHero
        photoUrl={photos[currentPhotoIndex]}
        nickname={profile.nickname}
        age={age}
        location={profile.location}
        height={profile.height}
        bodyType={profile.bodyType}
        religion={profile.religion}
        mbti={profile.mbti}
        occupation={profile.occupation}
        matchScore={profile.matchScore}
        verified={(profile.verificationBadges?.length ?? 0) > 0}
        onPhotoPress={() => photos.length > 0 && setIsPhotoFullscreen(true)}
        testId="detail-profile-hero"
        leadingControl={(
          <button onClick={(event) => { event.stopPropagation(); router.back(); }} className={styles.backControl} aria-label="뒤로가기">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
        )}
        trailingControl={<div onClick={(event) => event.stopPropagation()} className={styles.menuControl}><CardSettings onIntroduce={handleIntroduce} onDelete={handleDelete} onReport={handleReport} /></div>}
      />
      <AboutPanel bio={profile.bio} />
      <FactFile facts={[...facts]} />
      <NarrativeSections items={[...narratives]} />
      <VerifiedPanel profile={profile} />
      <CupidBrandCard memberId={profile.userId} />

      <div className={`${styles.actionBar} bottom-bottom-tab-bar-safe`} data-testid="profile-action-bar">
          {profile.alreadyLiked ? (
            /* 이미 좋아요를 보낸 상태 */
            profile.likeType === 'SUPER_OK' ? (
              /* 슈퍼OK 전송 완료 */
              <><p className={styles.sentState}>슈퍼 OK를 보냈습니다</p><button onClick={handlePass} className={styles.passButton}>돌아가기</button></>
            ) : (
              /* OK 전송 완료 → 슈퍼OK 업그레이드 옵션 */
              <>
                <p className={styles.sentState}>OK를 보냈습니다</p>
                <button
                  onClick={handleSuperOk}
                  disabled={isActioning || !pricing}
                  className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                  aria-label={`Super OK로 업그레이드${costPillLabel(pricing, 'SUPER_OK') ? ` (${costPillLabel(pricing, 'SUPER_OK')})` : ''}`}
                >
                  슈퍼 OK로 업그레이드 {costPillLabel(pricing, 'SUPER_OK')}
                </button>
              </>
            )
          ) : (
            /* 기본: Pass / OK / Super OK 버튼 */
            <>
              <button
                type="button"
                onClick={handlePass}
                disabled={isActioning}
                className={styles.passButton}
                aria-label="오늘은 지나가기"
              >
                오늘은 지나가기
              </button>

              {/* OK — 요금은 서버 /me/pricing 만 진실원(회장 결정 18·19·29). 조회 전엔 숫자를 보이지 않고 발신도 막는다. */}
              <button
                type="button"
                onClick={() => { void handleLike(); }}
                disabled={isActioning || !pricing}
                className={styles.actionButton}
                aria-label={`좋아요${costPillLabel(pricing, 'OK') ? ` (${costPillLabel(pricing, 'OK')})` : ''}`}
              >
                OK {costPillLabel(pricing, 'OK')}
              </button>

              {/* Super OK — 위와 동일 계약 */}
              <button
                type="button"
                onClick={() => { void handleSuperOk(); }}
                disabled={isActioning || !pricing}
                className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                aria-label={`Super OK${costPillLabel(pricing, 'SUPER_OK') ? ` (${costPillLabel(pricing, 'SUPER_OK')})` : ''}`}
              >
                슈퍼 OK {costPillLabel(pricing, 'SUPER_OK')}
              </button>
            </>
          )}
      </div>

      <div className={styles.reportRow}><button className={styles.reportButton} onClick={handleReport}>이 회원 신고하기</button></div>

      <HeartInsufficientDialog
        details={heartInsufficient}
        onClose={() => setHeartInsufficient(null)}
        onCharge={() => {
          setHeartInsufficient(null);
          router.push('/payment');
        }}
      />

      {/* 전체화면 사진 뷰어 */}
      {isPhotoFullscreen && photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button
            onClick={() => setIsPhotoFullscreen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-10"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={photos[currentPhotoIndex]}
            alt={profile.nickname}
            className="max-w-full max-h-full object-contain"
          />
          {/* 좌우 네비 */}
          {currentPhotoIndex > 0 && (
            <button
              onClick={() => setCurrentPhotoIndex((prev) => prev - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          {currentPhotoIndex < photos.length - 1 && (
            <button
              onClick={() => setCurrentPhotoIndex((prev) => prev + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
          {/* 인디케이터 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-sm">
            {currentPhotoIndex + 1} / {photos.length}
          </div>
        </div>
      )}

      {/* 신고 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="w-full max-w-screen-md bg-white dark:bg-dark-card rounded-t-3xl p-6">
            <h2 className="text-lg font-bold text-text dark:text-dark-cream mb-4">신고하기</h2>
            <div className="space-y-2 mb-4">
              {[
                { value: 'INAPPROPRIATE_CONTENT' as ReportReason, label: '부적절한 콘텐츠' },
                { value: 'HARASSMENT' as ReportReason, label: '괴롭힘/폭언' },
                { value: 'FAKE_PROFILE' as ReportReason, label: '허위 프로필' },
                { value: 'SPAM' as ReportReason, label: '스팸/광고' },
                { value: 'OTHER' as ReportReason, label: '기타' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setReportReason(item.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                    reportReason === item.value
                      ? 'bg-gold/10 dark:bg-dark-gold/10 text-gold dark:text-dark-gold font-medium border border-gold/30 dark:border-dark-gold/30'
                      : 'bg-ivory dark:bg-dark-bg text-text dark:text-dark-cream'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="상세 내용을 입력해주세요 (선택)"
              rows={3}
              className="w-full px-4 py-3 mb-4 rounded-xl bg-ivory dark:bg-dark-bg border border-[var(--border)] focus:border-gold dark:focus:border-dark-gold focus:outline-none text-sm text-text dark:text-dark-cream placeholder-subtext/40 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm text-subtext dark:text-[var(--subtext)]"
              >
                취소
              </button>
              <button
                onClick={submitReport}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-medium"
              >
                신고하기
              </button>
            </div>
          </div>
        </div>
      )}
      </article>
    </div>
  );
}
