'use client';

// 히스토리 페이지 — 모바일과 동일한 3개 섹션 가로 스크롤
// 받은 OK | 보낸 OK | 매칭

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { matchingApi, ProfileCardResponse, MatchingResponse } from '@/lib/api/matching';

interface SectionData {
  theirOk: ProfileCardResponse[];
  myOk: ProfileCardResponse[];
  matched: MatchingResponse[];
}

const statusLabel: Record<string, string> = {
  PENDING: '매칭성공',
  PROCEED: '매칭성공',
  IN_PROGRESS: '대화 중',
  HOLD: '보류',
  CLOSED: '종료',
};

// 히스토리 D-day (생성 +7일 만료). 모바일 getDDay와 동일 규칙.
function dDayLabel(expiresAt?: string | null): string | null {
  if (!expiresAt) return null;
  const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  if (diff <= 0) return 'D-0';
  return `D-${diff}`;
}

const statusColor: Record<string, string> = {
  PENDING: 'bg-green-500/20 text-green-600 dark:text-green-400',
  PROCEED: 'bg-green-500/20 text-green-600 dark:text-green-400',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  HOLD: 'bg-gray-500/20 text-gray-600 dark:text-gray-400',
  CLOSED: 'bg-red-500/20 text-red-600 dark:text-red-400',
};

export default function HistoryPage() {
  const router = useRouter();
  const [data, setData] = useState<SectionData>({
    theirOk: [], myOk: [], matched: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [theirOkRes, myOkRes, matchedRes] = await Promise.allSettled([
        matchingApi.getHistoryProfiles('their_ok', 0, 20),
        matchingApi.getHistoryProfiles('my_ok', 0, 20),
        matchingApi.getMyMatchings(0, 20),
      ]);
      // null 제거 (백엔드에서 매칭된 상대는 null 반환)
      const filterNull = (arr: ProfileCardResponse[]) => arr.filter(Boolean);
      setData({
        theirOk: filterNull(theirOkRes.status === 'fulfilled' ? theirOkRes.value.content : []),
        myOk: filterNull(myOkRes.status === 'fulfilled' ? myOkRes.value.content : []),
        matched: matchedRes.status === 'fulfilled' ? matchedRes.value.content : [],
      });
    } catch { /* Promise.allSettled로 개별 처리 */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
        <p className="mt-4 text-sm text-subtext dark:text-[var(--subtext)]">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6">
      {/* 받은 OK */}
      <ProfileSection
        title="받은 OK"
        profiles={data.theirOk}
        blurred
        badge="상대의 OK"
        badgeClass="bg-amber-500/20 text-amber-600 dark:text-amber-400"
        onPress={(id) => router.push(`/profiles/${id}?source=their_ok`)}
      />

      {/* 보낸 OK */}
      <ProfileSection
        title="보낸 OK"
        profiles={data.myOk}
        badge="OK 보냄"
        badgeClass="bg-green-500/20 text-green-600 dark:text-green-400"
        onPress={(id) => router.push(`/profiles/${id}?source=my_ok`)}
      />

      {/* 매칭 */}
      <MatchSection
        matched={data.matched}
        onPress={(matchingId) => router.push(`/matchings/${matchingId}`)}
      />
    </div>
  );
}

/** 프로필 가로 스크롤 섹션 */
function ProfileSection({
  title,
  profiles,
  blurred,
  badge,
  badgeClass,
  onPress,
}: {
  title: string;
  profiles: ProfileCardResponse[];
  blurred?: boolean;
  badge?: string;
  badgeClass?: string;
  onPress: (profileId: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-4">
        <h2 className="text-sm font-bold text-text dark:text-dark-cream">{title}</h2>
        <span className="text-xs text-subtext dark:text-[var(--subtext)]">{profiles.length}</span>
      </div>
      {profiles.length === 0 ? (
        <p className="text-xs text-subtext dark:text-[var(--subtext)] py-6 text-center">아직 없습니다</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide">
          {profiles.map((p) => (
            <button
              key={p.profileId}
              onClick={() => onPress(p.profileId)}
              className="w-40 flex-shrink-0 rounded-2xl overflow-hidden bg-white dark:bg-dark-card border border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40 transition-colors text-left"
            >
              {/* 프로필 이미지 */}
              <div className="relative aspect-[3/4] bg-ivory dark:bg-dark-bg">
                {p.photoUrls?.[0] ? (
                  <img
                    src={p.photoUrls[0]}
                    alt={p.nickname}
                    className={`w-full h-full object-cover ${blurred ? 'blur-md opacity-50' : ''}`}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-subtext/20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
                {/* 블러 오버레이 */}
                {blurred && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <div className="w-10 h-10 rounded-full bg-gold/80 dark:bg-dark-gold/80 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                  </div>
                )}
                {/* 인증 배지 */}
                {p.verified && !blurred && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold bg-gold dark:bg-dark-gold text-white rounded-full">
                    인증
                  </span>
                )}
                {/* D-day 만료 배지 (생성 +7일) */}
                {dDayLabel(p.expiresAt) && (
                  <span className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-extrabold rounded-full text-white ${dDayLabel(p.expiresAt) === 'D-0' ? 'bg-red-600' : 'bg-black/55'}`}>
                    {dDayLabel(p.expiresAt)}
                  </span>
                )}
                {/* SUPER_OK 배지 */}
                {(p as ProfileCardResponse & { likeType?: string }).likeType === 'SUPER_OK' && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full">
                    SUPER OK
                  </span>
                )}
              </div>
              {/* 프로필 정보 */}
              <div className="p-2.5">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold text-text dark:text-dark-cream truncate ${blurred ? 'blur-sm' : ''}`}>
                    {p.nickname}
                  </span>
                  <span className="text-[10px] text-subtext dark:text-[var(--subtext)] flex-shrink-0 ml-1">
                    {p.age}세
                  </span>
                </div>
                {p.occupation && (
                  <p className="text-[10px] text-gold dark:text-dark-gold font-medium mt-0.5 truncate">
                    {p.occupation}
                  </p>
                )}
                {badge && (
                  <span className={`inline-block mt-1.5 px-2 py-0.5 text-[9px] font-bold rounded-full ${badgeClass}`}>
                    {badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** 매칭 가로 스크롤 섹션 */
function MatchSection({
  matched,
  onPress,
}: {
  matched: MatchingResponse[];
  onPress: (matchingId: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-4">
        <h2 className="text-sm font-bold text-text dark:text-dark-cream">매칭</h2>
        <span className="text-xs text-subtext dark:text-[var(--subtext)]">{matched.length}</span>
      </div>
      {/* 매칭 응원 배너 */}
      {matched.length > 0 && (
        <div className="mx-4 mb-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-gold/10 dark:bg-dark-gold/10">
          <svg className="w-4 h-4 text-gold dark:text-dark-gold" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="text-xs font-semibold text-gold dark:text-dark-gold">좋은 인연을 응원합니다!</span>
        </div>
      )}
      {matched.length === 0 ? (
        <p className="text-xs text-subtext dark:text-[var(--subtext)] py-6 text-center">아직 매칭이 없습니다</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide">
          {matched.map((m) => (
            <button
              key={m.matchingId}
              onClick={() => onPress(m.matchingId)}
              className="w-40 flex-shrink-0 rounded-2xl overflow-hidden bg-white dark:bg-dark-card border border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40 transition-colors text-left"
            >
              {/* 카드 사진 */}
              <div className="relative aspect-[3/4] bg-ivory dark:bg-dark-bg">
                {m.partnerProfile?.photoUrls?.[0] ? (
                  <img
                    src={m.partnerProfile.photoUrls[0]}
                    alt={m.partnerProfile.nickname}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-subtext/20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
                {/* 상태 뱃지 */}
                <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded-full ${statusColor[m.status] || 'bg-gray-500/20 text-gray-500'}`}>
                  {statusLabel[m.status] || m.status}
                </span>
              </div>
              {/* 프로필 정보 */}
              <div className="p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text dark:text-dark-cream truncate">
                    {m.partnerProfile?.nickname}
                  </span>
                  <span className="text-[10px] text-subtext dark:text-[var(--subtext)] flex-shrink-0 ml-1">
                    {m.partnerProfile?.age}세
                  </span>
                </div>
                {m.partnerProfile?.occupation && (
                  <p className="text-[10px] text-gold dark:text-dark-gold font-medium mt-0.5 truncate">
                    {m.partnerProfile.occupation}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
