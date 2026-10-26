'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { notificationApi, NotificationPreference } from '@/lib/api/notification';
import { authApi } from '@/lib/api/auth';
import { safetyApi } from '@/lib/api/safety';
import apiClient from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/errorHandler';

/**
 * 기본 설정 페이지
 * 알림 설정 (토글), 아는사람 피하기, 계정 관리
 */
export default function SettingsPage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const showToast = useUIStore((state) => state.showToast);

  // 알림 설정 상태
  const [matchingNotif, setMatchingNotif] = useState(true);
  const [likeNotif, setLikeNotif] = useState(true);
  const [chatNotif, setChatNotif] = useState(true);
  const [isLoadingNotif, setIsLoadingNotif] = useState(true);

  // 차단 목록 상태
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [showBlockedList, setShowBlockedList] = useState(false);

  // 계정 삭제 확인
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // 알림 설정 로드
  const fetchNotificationPrefs = useCallback(async () => {
    setIsLoadingNotif(true);
    try {
      const prefs = await notificationApi.getPreferences();
      setMatchingNotif(prefs.fcmEnabled);
      setLikeNotif(prefs.kakaoEnabled);
      setChatNotif(prefs.emailEnabled);
    } catch {
      // 설정 없으면 기본값 유지
    } finally {
      setIsLoadingNotif(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificationPrefs();
  }, [fetchNotificationPrefs]);

  // 차단 목록 로드
  const fetchBlockedUsers = async () => {
    setIsLoadingBlocks(true);
    try {
      const data = await safetyApi.getBlockedUsers(0);
      setBlockedUsers(data.content || []);
    } catch {
      // 차단 목록 조회 실패 시 빈 배열 유지
    } finally {
      setIsLoadingBlocks(false);
    }
  };

  // 차단 해제
  const handleUnblock = async (userId: number) => {
    try {
      await safetyApi.unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((u) => u.blockedUserId !== userId && u.id !== userId));
      showToast('차단이 해제되었습니다.');
    } catch (err) {
      showToast(getErrorMessage(err));
    }
  };

  // 알림 설정 저장
  const updateNotificationPref = async (key: string, value: boolean) => {
    try {
      const prefs: NotificationPreference = {
        fcmEnabled: key === 'matching' ? value : matchingNotif,
        kakaoEnabled: key === 'like' ? value : likeNotif,
        emailEnabled: key === 'chat' ? value : chatNotif,
      };
      await notificationApi.updatePreferences(prefs);

      // 상태 업데이트
      if (key === 'matching') setMatchingNotif(value);
      if (key === 'like') setLikeNotif(value);
      if (key === 'chat') setChatNotif(value);
    } catch (err) {
      showToast(getErrorMessage(err));
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // 로그아웃 API 실패해도 로컬 상태 초기화
    } finally {
      logout();
      router.push('/login');
    }
  };

  // 회원 탈퇴
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '탈퇴합니다') {
      showToast('확인 문구를 정확히 입력해주세요.');
      return;
    }

    try {
      await apiClient.delete('/auth/account');
      logout();
      showToast('회원 탈퇴가 완료되었습니다.');
      router.push('/login');
    } catch (err) {
      showToast(getErrorMessage(err));
    }
  };

  return (
    <div className="px-4 py-4">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-subtext dark:text-[var(--subtext)]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text dark:text-dark-cream">설정</h1>
        <div className="w-6" />
      </div>

      {/* === 알림 설정 === */}
      <SettingSection title="알림 설정">
        <ToggleItem
          label="푸시 알림"
          description="FCM 푸시 알림을 받습니다"
          value={matchingNotif}
          onChange={(v) => updateNotificationPref('matching', v)}
          disabled={isLoadingNotif}
        />
        <ToggleItem
          label="카카오 알림톡"
          description="카카오톡으로 알림을 받습니다"
          value={likeNotif}
          onChange={(v) => updateNotificationPref('like', v)}
          disabled={isLoadingNotif}
        />
        <ToggleItem
          label="이메일 알림"
          description="이메일로 알림을 받습니다"
          value={chatNotif}
          onChange={(v) => updateNotificationPref('chat', v)}
          disabled={isLoadingNotif}
        />
      </SettingSection>

      {/* === 차단 관리 === */}
      <SettingSection title="차단 관리">
        <button
          onClick={() => {
            setShowBlockedList(!showBlockedList);
            if (!showBlockedList && blockedUsers.length === 0) fetchBlockedUsers();
          }}
          className="w-full px-4 py-3.5 text-left flex items-center justify-between hover:bg-ivory/50 dark:hover:bg-dark-bg/50 transition-colors"
        >
          <div>
            <p className="text-sm font-medium text-text dark:text-dark-cream">차단 목록</p>
            <p className="text-xs text-subtext dark:text-[var(--subtext)] mt-0.5">차단한 사용자를 관리합니다</p>
          </div>
          <svg className={`w-4 h-4 text-subtext dark:text-[var(--subtext)] transition-transform ${showBlockedList ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showBlockedList && (
          <div className="border-t border-[var(--border)]">
            {isLoadingBlocks ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
              </div>
            ) : blockedUsers.length === 0 ? (
              <p className="px-4 py-4 text-xs text-subtext dark:text-[var(--subtext)] text-center">
                차단한 사용자가 없습니다.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {blockedUsers.map((blocked) => (
                  <div key={blocked.blockedUserId || blocked.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-text dark:text-dark-cream">{blocked.nickname || blocked.blockedNickname || `사용자 #${blocked.blockedUserId || blocked.id}`}</p>
                    </div>
                    <button
                      onClick={() => handleUnblock(blocked.blockedUserId || blocked.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      해제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SettingSection>

      {/* === 아는사람 피하기 === */}
      <SettingSection title="아는사람 피하기">
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/10 dark:bg-dark-gold/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gold dark:text-dark-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-text dark:text-dark-cream mb-1">연락처 연동</h3>
              <p className="text-xs text-subtext dark:text-[var(--subtext)] leading-relaxed mb-3">
                연락처를 연동하면 지인이 추천 목록에 노출되지 않습니다.
                연락처 정보는 암호화되어 저장되며, 매칭 외 목적으로 사용되지 않습니다.
              </p>
              <button className="px-4 py-2 rounded-xl border border-gold dark:border-dark-gold text-gold dark:text-dark-gold text-sm font-medium hover:bg-gold/5 dark:hover:bg-dark-gold/5 transition-colors">
                연락처 연동하기
              </button>
            </div>
          </div>
        </div>
      </SettingSection>

      {/* === AI 추천 정보 처리 === */}
      <SettingSection title="개인정보">
        <button
          onClick={() => router.push('/ai-consent?mode=settings')}
          className="flex min-h-14 w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-text transition-colors hover:bg-ivory/50 dark:text-dark-cream dark:hover:bg-dark-bg/50"
          data-testid="settings-ai-consent"
        >
          <span>
            <span className="block">AI 추천 정보 처리</span>
            <span className="mt-0.5 block text-sm font-normal text-subtext dark:text-[var(--subtext)]">동의 상태 확인과 철회</span>
          </span>
          <svg className="h-4 w-4 text-subtext dark:text-[var(--subtext)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </SettingSection>

      {/* === 약관 === */}
      <SettingSection title="약관">
        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full px-4 py-3.5 text-left text-sm font-medium text-text dark:text-dark-cream hover:bg-ivory/50 dark:hover:bg-dark-bg/50 transition-colors border-b border-[var(--border)] flex items-center justify-between"
        >
          <span>이용약관</span>
          <svg className="w-4 h-4 text-subtext dark:text-[var(--subtext)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full px-4 py-3.5 text-left text-sm font-medium text-text dark:text-dark-cream hover:bg-ivory/50 dark:hover:bg-dark-bg/50 transition-colors flex items-center justify-between"
        >
          <span>개인정보처리방침</span>
          <svg className="w-4 h-4 text-subtext dark:text-[var(--subtext)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </SettingSection>

      {/* === 계정 관리 === */}
      <SettingSection title="계정 관리">
        {/* 비밀번호 변경 (SMS 기반이므로 별도 비밀번호 없음 → 안내) */}
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <p className="text-sm text-text dark:text-dark-cream font-medium">인증 방식</p>
          <p className="text-xs text-subtext dark:text-[var(--subtext)] mt-0.5">
            전화번호 OTP 인증 (별도 비밀번호 없음)
          </p>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3.5 text-left text-sm font-medium text-text dark:text-dark-cream hover:bg-ivory/50 dark:hover:bg-dark-bg/50 transition-colors border-b border-[var(--border)]"
        >
          로그아웃
        </button>

        {/* 회원 탈퇴 */}
        <button
          onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
          className="w-full px-4 py-3.5 text-left text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
        >
          회원 탈퇴
        </button>

        {/* 회원 탈퇴 확인 */}
        {showDeleteConfirm && (
          <div className="px-4 py-4 bg-red-50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-900/30">
            <p className="text-xs text-red-600 dark:text-red-400 mb-3 leading-relaxed">
              탈퇴하시면 모든 데이터가 삭제되며 복구할 수 없습니다.
              <br />
              확인을 위해 아래에 <strong>&quot;탈퇴합니다&quot;</strong>를 입력해주세요.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="탈퇴합니다"
              className="w-full px-4 py-2.5 mb-3 rounded-xl bg-white dark:bg-dark-card border border-red-200 dark:border-red-800 focus:border-red-400 dark:focus:border-red-600 focus:outline-none text-sm text-text dark:text-dark-cream placeholder-subtext/40"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm text-subtext dark:text-[var(--subtext)]"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== '탈퇴합니다'}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        )}
      </SettingSection>
    </div>
  );
}

/** 설정 섹션 래퍼 */
function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-subtext dark:text-[var(--subtext)] uppercase tracking-wider mb-2 px-1">
        {title}
      </h2>
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/** 토글 아이템 */
function ToggleItem({
  label,
  description,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)] last:border-b-0">
      <div>
        <p className="text-sm font-medium text-text dark:text-dark-cream">{label}</p>
        <p className="text-xs text-subtext dark:text-[var(--subtext)] mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        disabled={disabled}
        className={`
          relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 overflow-hidden
          ${value ? 'bg-gold dark:bg-dark-gold' : 'bg-subtext/30'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        aria-label={`${label} ${value ? '끄기' : '켜기'}`}
      >
        <span
          className={`
            absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300
            ${value ? 'translate-x-[1.25rem]' : 'translate-x-0.5'}
          `}
        />
      </button>
    </div>
  );
}
