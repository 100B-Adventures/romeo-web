'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { isAdminRole } from '../_components/adminAuth';

// OTP 입력 자릿수
const OTP_LENGTH = 6;

// 관리자 전용 로그인 페이지 — 호텔 로비 감성
// 전화번호 → OTP → 로그인 → ADMIN 권한 체크 → /dashboard
export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  // 플로우 단계: phone → otp → loading
  const [step, setStep] = useState<'phone' | 'otp' | 'loading'>('phone');

  // 전화번호 입력
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // OTP 입력
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 로딩 상태
  const [isRequesting, setIsRequesting] = useState(false);

  // 로딩 화면 후 /dashboard 이동
  useEffect(() => {
    if (step === 'loading') {
      const timer = setTimeout(() => {
        router.push('/admin');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  // 전화번호 포맷 (010-1234-5678)
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  // 전화번호 유효성 검사
  const isValidPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return /^01[0-9]\d{7,8}$/.test(digits);
  };

  // OTP 요청
  const handleRequestOtp = async () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (!isValidPhone(phoneNumber)) {
      setPhoneError('올바른 전화번호를 입력해주세요.');
      return;
    }

    setPhoneError('');
    setIsRequesting(true);
    try {
      await authApi.requestPhoneVerification(digits, 'LOGIN');
      setStep('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error) {
      setPhoneError(getErrorMessage(error));
    } finally {
      setIsRequesting(false);
    }
  };

  // OTP 입력 핸들러
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');

    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // OTP 백스페이스 핸들러
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // OTP 검증 후 로그인 + ADMIN 체크
  const handleVerifyAndLogin = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      setOtpError('인증번호 6자리를 입력해주세요.');
      return;
    }

    const digits = phoneNumber.replace(/\D/g, '');
    setIsRequesting(true);
    try {
      // OTP 검증
      await authApi.verifyPhone(digits, otpCode, 'LOGIN');

      // 로그인
      const response = await authApi.login(digits);

      // 서버가 내려준 실제 권한만 신뢰한다. 값 누락·알 수 없는 값·일반 회원은 모두 기본 거부한다.
      const userRole = response.role;
      if (!isAdminRole(userRole)) {
        setOtpError('관리자 권한이 필요합니다');
        setIsRequesting(false);
        return;
      }

      // 로그인 상태 저장
      login(
        {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
        {
          userId: response.userId,
          nickname: response.nickname || '',
          gender: response.gender || 'MALE',
          status: (response.status as 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED') || 'ACTIVE',
          profilePhoto: response.profilePhoto,
          role: userRole,
        }
      );

      // 로딩 화면 전환
      setStep('loading');
    } catch (error) {
      setOtpError(getErrorMessage(error));
    } finally {
      setIsRequesting(false);
    }
  };

  // 로딩 화면
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-ivory dark:bg-dark-bg flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin mb-8" />
        <h2 className="text-xl font-bold text-text dark:text-dark-cream mb-2">
          관리자 인증 완료
        </h2>
        <p className="text-sm text-subtext dark:text-[var(--subtext)]">
          대시보드로 이동 중...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory dark:bg-dark-bg flex flex-col items-center justify-center px-4 py-12">
      {/* 상단 골드 라인 */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold dark:via-dark-gold to-transparent" />

      {/* 로고 */}
      <div className="mb-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 dark:bg-dark-gold/10 border border-gold/30 dark:border-dark-gold/30 flex items-center justify-center">
          <svg className="w-7 h-7 text-gold dark:text-dark-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gold dark:text-dark-gold">
          Romeo & Cupid
        </h1>
        <p className="mt-1.5 text-xs tracking-widest uppercase text-subtext dark:text-[var(--subtext)]">
          Admin Portal
        </p>
      </div>

      {/* 카드 */}
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-[var(--border)] p-8 shadow-sm">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-text dark:text-dark-cream mb-1.5">
              {step === 'phone' ? '관리자 로그인' : '인증번호 확인'}
            </h2>
            <p className="text-sm text-subtext dark:text-[var(--subtext)]">
              {step === 'phone'
                ? '관리자 전화번호로 로그인하세요'
                : `${formatPhone(phoneNumber)}로 전송된 인증번호를 입력하세요`}
            </p>
          </div>

          {/* Step 1: 전화번호 입력 */}
          {step === 'phone' && (
            <div>
              <label className="block text-sm font-medium text-text dark:text-dark-cream mb-2">
                전화번호
              </label>
              <input
                type="tel"
                value={formatPhone(phoneNumber)}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleRequestOtp()}
                placeholder="010-0000-0000"
                className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-ivory dark:bg-dark-bg text-text dark:text-dark-cream placeholder:text-subtext/50 focus:outline-none focus:border-gold dark:focus:border-dark-gold transition-colors text-center text-lg tracking-wider"
                autoFocus
              />
              {phoneError && (
                <p className="mt-2 text-xs text-red-500 text-center">{phoneError}</p>
              )}
              <button
                onClick={handleRequestOtp}
                disabled={isRequesting}
                className="w-full mt-6 py-3.5 rounded-xl bg-gold dark:bg-dark-gold text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequesting ? '요청 중...' : '인증번호 받기'}
              </button>
            </div>
          )}

          {/* Step 2: OTP 입력 */}
          {step === 'otp' && (
            <div>
              <div className="flex justify-center gap-2.5 mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-11 h-14 rounded-lg border border-[var(--border)] bg-ivory dark:bg-dark-bg text-text dark:text-dark-cream text-center text-xl font-bold focus:outline-none focus:border-gold dark:focus:border-dark-gold transition-colors"
                  />
                ))}
              </div>
              {otpError && (
                <p className="mt-2 text-xs text-red-500 text-center">{otpError}</p>
              )}

              {/* OTP 재요청 */}
              <button
                onClick={handleRequestOtp}
                disabled={isRequesting}
                className="block mx-auto mt-2 text-xs text-subtext dark:text-[var(--subtext)] hover:text-gold dark:hover:text-dark-gold transition-colors disabled:opacity-50"
              >
                인증번호 재전송
              </button>

              <button
                onClick={handleVerifyAndLogin}
                disabled={isRequesting || otp.join('').length !== OTP_LENGTH}
                className="w-full mt-6 py-3.5 rounded-xl bg-gold dark:bg-dark-gold text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequesting ? '확인 중...' : '관리자 로그인'}
              </button>

              {/* 뒤로가기 */}
              <button
                onClick={() => {
                  setStep('phone');
                  setOtp(Array(OTP_LENGTH).fill(''));
                  setOtpError('');
                }}
                className="block mx-auto mt-4 text-sm text-subtext dark:text-[var(--subtext)] hover:text-text dark:hover:text-dark-cream transition-colors"
              >
                전화번호 다시 입력
              </button>
            </div>
          )}
        </div>

        {/* 하단 안내 */}
        <p className="mt-6 text-center text-xs text-subtext/50 dark:text-[var(--subtext)]/50">
          관리자 계정으로만 접근할 수 있습니다
        </p>
      </div>

      {/* 하단 장식 */}
      <p className="mt-8 text-xs text-subtext/50 dark:text-[var(--subtext)]/50">
        &copy; 2026 Romeo & Cupid
      </p>
    </div>
  );
}
