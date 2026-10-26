'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { profileApi, CharmStatsResponse } from '@/lib/api/profile';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import PercentileBadge from '@/components/common/PercentileBadge';

/**
 * 매력지수 페이지
 * 프로필 조회수, 받은 좋아요, 매칭 성공률, 상위 % 변화 추이, 팁 섹션
 */
export default function CharmPage() {
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);

  // 데이터가 없을 때 기본값
  const defaultStats: CharmStatsResponse = {
    profileViews: 0,
    receivedLikes: 0,
    matchSuccessRate: 0,
    percentileRank: user?.percentileRank ?? 50,
    weeklyViews: [0, 0, 0, 0, 0, 0, 0],
    weeklyLikes: [0, 0, 0, 0, 0, 0, 0],
    rankHistory: [],
  };

  const [stats, setStats] = useState<CharmStatsResponse>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  // 매력지수 데이터 로드
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await profileApi.getCharmStats();
      setStats(data ?? defaultStats);
    } catch {
      // 백엔드 미구현 또는 에러 시 기본값 유지
      setStats(defaultStats);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.percentileRank]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 로딩
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
        <p className="mt-4 text-sm text-subtext dark:text-[var(--subtext)]">매력지수를 분석하고 있습니다...</p>
      </div>
    );
  }

  // 요일 라벨
  const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <div className="px-4 py-4">
      {/* 페이지 헤더 */}
      <h1 className="text-lg font-bold text-text dark:text-dark-cream mb-6">매력지수</h1>

      {/* 상위 % 뱃지 (크게) */}
      <div className="flex flex-col items-center mb-8">
        <div className="mb-3">
          <PercentileBadge rank={stats?.percentileRank ?? 50} />
        </div>
        <p className="text-sm text-subtext dark:text-[var(--subtext)]">
          전체 회원 중 상위 {stats?.percentileRank ?? 50}%에 위치해 있습니다
        </p>
      </div>

      {/* 핵심 지표 카드 3개 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          label="프로필 조회"
          value={(stats?.profileViews ?? 0).toLocaleString()}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="받은 좋아요"
          value={(stats?.receivedLikes ?? 0).toLocaleString()}
          icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          }
        />
        <StatCard
          label="매칭 성공률"
          value={`${stats?.matchSuccessRate ?? 0}%`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          }
        />
      </div>

      {/* 주간 프로필 조회수 차트 */}
      <ChartSection title="주간 프로필 조회수">
        <BarChart data={stats?.weeklyViews ?? [0, 0, 0, 0, 0, 0, 0]} labels={dayLabels} color="gold" />
      </ChartSection>

      {/* 주간 받은 좋아요 차트 */}
      <ChartSection title="주간 받은 좋아요">
        <BarChart data={stats?.weeklyLikes ?? [0, 0, 0, 0, 0, 0, 0]} labels={dayLabels} color="rosegold" />
      </ChartSection>

      {/* 상위 % 변화 추이 */}
      {(stats?.rankHistory?.length ?? 0) > 0 && (
        <ChartSection title="상위 % 변화 추이">
          <div className="flex items-end justify-between gap-1 h-24 px-2">
            {(stats?.rankHistory ?? []).map((rank, index) => (
              <div key={index} className="flex flex-col items-center flex-1 gap-1">
                <span className="text-[9px] text-subtext dark:text-[var(--subtext)]">{rank}%</span>
                <div
                  className="w-full bg-gold/30 dark:bg-dark-gold/30 rounded-t"
                  style={{ height: `${Math.max(4, (100 - rank))}%` }}
                />
              </div>
            ))}
          </div>
        </ChartSection>
      )}

      {/* 더 높은 매력지수를 위한 팁 */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-text dark:text-dark-cream mb-3 px-1">
          매력지수를 올리는 팁
        </h2>
        <div className="flex flex-col gap-2">
          <TipCard
            emoji="1."
            title="프로필 사진을 다양하게"
            description="얼굴이 잘 보이는 사진 + 취미/일상 사진을 추가하세요"
          />
          <TipCard
            emoji="2."
            title="자기소개를 구체적으로"
            description="취미, 가치관, 원하는 만남 등을 상세히 적어보세요"
          />
          <TipCard
            emoji="3."
            title="인증 뱃지를 채워보세요"
            description="인증 뱃지가 많을수록 신뢰도와 매력지수가 올라갑니다"
          />
          <TipCard
            emoji="4."
            title="적극적으로 활동하세요"
            description="좋아요를 보내고 프로필을 자주 업데이트하면 노출이 증가합니다"
          />
        </div>
      </div>
    </div>
  );
}

/** 지표 카드 */
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)] text-center">
      <div className="flex justify-center mb-2 text-gold dark:text-dark-gold">{icon}</div>
      <p className="text-lg font-bold text-text dark:text-dark-cream tabular-nums">{value}</p>
      <p className="text-[10px] text-subtext dark:text-[var(--subtext)] mt-0.5">{label}</p>
    </div>
  );
}

/** 차트 섹션 래퍼 */
function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-bold text-text dark:text-dark-cream mb-3 px-1">{title}</h2>
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]">
        {children}
      </div>
    </div>
  );
}

/** 막대 차트 */
function BarChart({
  data,
  labels,
  color,
}: {
  data: number[];
  labels: string[];
  color: 'gold' | 'rosegold';
}) {
  const maxValue = Math.max(...data, 1);
  const colorClass = color === 'gold'
    ? 'bg-gold dark:bg-dark-gold'
    : 'bg-rosegold dark:bg-rosegold';

  return (
    <div className="flex items-end justify-between gap-2 h-28">
      {data.map((value, index) => (
        <div key={index} className="flex flex-col items-center flex-1 gap-1.5 h-full justify-end">
          {value > 0 && (
            <span className="text-[9px] font-medium text-subtext dark:text-[var(--subtext)] tabular-nums">
              {value}
            </span>
          )}
          <div
            className={`w-full rounded-t-md ${colorClass} transition-all duration-500 min-h-[2px]`}
            style={{ height: `${(value / maxValue) * 80}%` }}
          />
          <span className="text-[10px] text-subtext dark:text-[var(--subtext)]">
            {labels[index]}
          </span>
        </div>
      ))}
    </div>
  );
}

/** 팁 카드 */
function TipCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]">
      <span className="text-sm font-bold text-gold dark:text-dark-gold flex-shrink-0 mt-0.5">{emoji}</span>
      <div>
        <h3 className="text-sm font-bold text-text dark:text-dark-cream">{title}</h3>
        <p className="text-xs text-subtext dark:text-[var(--subtext)] mt-0.5">{description}</p>
      </div>
    </div>
  );
}
