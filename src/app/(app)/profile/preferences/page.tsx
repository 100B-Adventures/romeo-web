'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { profileApi, PreferencesResponse, UpdatePreferencesRequest } from '@/lib/api/profile';
import { getErrorMessage } from '@/lib/utils/errorHandler';

// 선택 옵션 상수
const LOCATIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원'];
const LOCATION_SCOPES = ['LOCAL', 'ALL'] as const;
const LOCATION_SCOPE_LABELS: Record<string, string> = {
  LOCAL: '선택 생활권',
  ALL: '전체 지역',
};

/**
 * 상대 선호도 설정 페이지
 * 나이 범위 슬라이더, 선호 지역, 지역 범위
 */
export default function PreferencesPage() {
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 선호도 상태
  const [minAge, setMinAge] = useState(25);
  const [maxAge, setMaxAge] = useState(35);
  const [preferredLocation, setPreferredLocation] = useState('');
  const [locationScope, setLocationScope] = useState<'LOCAL' | 'ALL'>('ALL');

  // 기존 설정 로드
  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await profileApi.getPreferences();
      setMinAge(data.minAge || 25);
      setMaxAge(data.maxAge || 35);
      setPreferredLocation(data.preferredLocation || '');
      setLocationScope(data.locationScope === 'LOCAL' ? 'LOCAL' : 'ALL');
    } catch {
      // 설정이 없으면 기본값 사용
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // 저장
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const request: UpdatePreferencesRequest = {
        minAge,
        maxAge,
        preferredLocation,
        locationScope,
      };
      await profileApi.updatePreferences(request);
      showToast('선호도가 저장되었습니다.');
      router.back();
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // 로딩
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
        <p className="mt-4 text-sm text-subtext dark:text-[var(--subtext)]">설정을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-36">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-subtext dark:text-[var(--subtext)]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text dark:text-dark-cream">선호도 설정</h1>
        <div className="w-6" />
      </div>

      {/* 선호 나이 범위 */}
      <Section title="선호 나이">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-subtext dark:text-[var(--subtext)]">최소</span>
          <span className="text-sm font-bold text-gold dark:text-dark-gold">{minAge}세 ~ {maxAge}세</span>
          <span className="text-sm text-subtext dark:text-[var(--subtext)]">최대</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-subtext dark:text-[var(--subtext)]">최소 나이: {minAge}세</label>
            <input
              type="range"
              min={20}
              max={50}
              value={minAge}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMinAge(val);
                if (val > maxAge) setMaxAge(val);
              }}
              className="w-full h-2 bg-ivory dark:bg-dark-bg rounded-lg appearance-none cursor-pointer accent-gold dark:accent-dark-gold"
            />
          </div>
          <div>
            <label className="text-xs text-subtext dark:text-[var(--subtext)]">최대 나이: {maxAge}세</label>
            <input
              type="range"
              min={20}
              max={50}
              value={maxAge}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxAge(val);
                if (val < minAge) setMinAge(val);
              }}
              className="w-full h-2 bg-ivory dark:bg-dark-bg rounded-lg appearance-none cursor-pointer accent-gold dark:accent-dark-gold"
            />
          </div>
        </div>
      </Section>

      {/* 선호 지역 */}
      <Section title="선호 지역">
        <div className="flex flex-wrap gap-2">
          {LOCATIONS.map((loc) => (
            <ChipButton
              key={loc}
              label={loc}
              selected={preferredLocation === loc}
              onClick={() => setPreferredLocation(preferredLocation === loc ? '' : loc)}
            />
          ))}
        </div>
      </Section>

      {/* 지역 범위 */}
      <Section title="지역 범위">
        <div className="flex flex-wrap gap-2">
          {LOCATION_SCOPES.map((scope) => (
            <ChipButton
              key={scope}
              label={LOCATION_SCOPE_LABELS[scope]}
              selected={locationScope === scope}
              onClick={() => setLocationScope(scope)}
            />
          ))}
        </div>
      </Section>

      {/* 하단 저장 버튼 (고정) */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white dark:bg-dark-card border-t border-[var(--border)] z-20">
        <div className="max-w-screen-md mx-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold text-white font-bold text-base shadow-lg shadow-gold/20 dark:shadow-dark-gold/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 섹션 래퍼 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-bold text-text dark:text-dark-cream mb-3 px-1">{title}</h2>
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]">
        {children}
      </div>
    </div>
  );
}

/** 칩 버튼 */
function ChipButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3.5 py-2 rounded-full text-sm font-medium transition-all
        ${selected
          ? 'bg-gold dark:bg-dark-gold text-white shadow-sm'
          : 'bg-ivory dark:bg-dark-bg text-subtext dark:text-[var(--subtext)] hover:border-gold/40 dark:hover:border-dark-gold/40'
        }
      `}
    >
      {label}
    </button>
  );
}
