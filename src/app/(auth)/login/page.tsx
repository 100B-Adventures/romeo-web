'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { webLoginBranch, WEB_IDV_UNAVAILABLE_MESSAGE } from '@/lib/authFlow';
import { IdvBlockedScreen } from '@/components/auth/IdvBlockedScreen';

// OTP 입력 자릿수
const OTP_LENGTH = 6;
const IDV_HANDOFF_STORAGE_KEY = 'romeo:idv-signup-handoff:v1';

/**
 * 로그인 페이지: 호텔 체크인 감성
 * 전화번호 입력 → 서버 가입·재로그인 판정 → IDV 또는 OTP → /home
 */
export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [step, setStep] = useState<'phone' | 'otp' | 'declaration' | 'loading'>('phone');

  // 전화번호 입력
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showPhoneReason, setShowPhoneReason] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState('');
  const [blockedAdultAt, setBlockedAdultAt] = useState<string | null>(null);

  // OTP 입력
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [adultDeclarationRequired, setAdultDeclarationRequired] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [birthYear, setBirthYear] = useState('');
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 로딩 상태
  const [isRequesting, setIsRequesting] = useState(false);

  // 로딩 화면 후 /home 이동
  useEffect(() => {
    if (step === 'loading') {
      const timer = setTimeout(() => {
        router.push('/home');
      }, 2000);
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
      // 서버가 먼저 가입 경로인지 재로그인 경로인지 판정한다 (결정 33).
      // 웹이 이걸 묻지 않고 바로 문자를 보내던 것이 성인확인 우회의 입구였다.
      const branch = webLoginBranch(await authApi.loginStart(digits));
      if (branch.kind === 'blocked') {
        setBlockedMessage(branch.message);
        setBlockedAdultAt(branch.adultAt);
        return;
      }
      if (branch.kind === 'idv') {
        // 전화번호와 본인확인 세션은 URL, history, 서버 로그에 남기지 않는다.
        // signup이 한 번 읽고 즉시 지우는 같은 탭 전용 handoff다.
        window.sessionStorage.setItem(IDV_HANDOFF_STORAGE_KEY, JSON.stringify({
          phone: digits,
          idvSessionId: branch.sessionId,
        }));
        router.push('/signup');
        return;
      }
      if (branch.kind === 'idv-unavailable') {
        setPhoneError(WEB_IDV_UNAVAILABLE_MESSAGE);
        return;
      }

      if (branch.kind === 'signup') {
        window.sessionStorage.setItem('romeo:sms-signup-phone:v1', digits);
        router.push('/signup');
        return;
      }

      setAdultDeclarationRequired(branch.adultDeclarationRequired);
      await authApi.requestPhoneVerification(digits, 'LOGIN');
      setStep('otp');
      // 첫 번째 OTP 입력칸에 포커스
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

    // 다음 칸으로 자동 이동
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

  // OTP 검증 후 로그인
  const handleVerifyAndLogin = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      setOtpError('인증번호 6자리를 입력해주세요.');
      return;
    }

    const digits = phoneNumber.replace(/\D/g, '');
    const currentYear = new Date().getFullYear();
    const parsedBirthYear = /^\d{4}$/.test(birthYear) ? Number(birthYear) : null;
    if (step === 'declaration' && (parsedBirthYear === null
      || parsedBirthYear < currentYear - 100
      || parsedBirthYear > currentYear - 19
      || !declarationConfirmed)) {
      setOtpError(`출생연도와 만 19세 이상 확인이 필요합니다. ${currentYear - 19}년생까지 이용할 수 있습니다.`);
      return;
    }
    setIsRequesting(true);
    try {
      // OTP 검증
      if (!otpVerified) {
        await authApi.verifyPhone(digits, otpCode, 'LOGIN');
        setOtpVerified(true);
      }
      if (adultDeclarationRequired && step === 'otp') {
        setStep('declaration');
        setIsRequesting(false);
        return;
      }

      // 로그인
      const response = await authApi.login(digits, adultDeclarationRequired && parsedBirthYear !== null ? {
        birthYear: parsedBirthYear,
        adultDeclaration: {
          confirmedNineteenOrOlder: true,
          version: 'adult-self-declaration-v1',
        },
      } : undefined);

      // 로그인 응답에 포함된 프로필 데이터 사용
      const userStatus = (response.status as 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED') || 'ACTIVE';
      login(
        {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
        {
          userId: response.userId,
          nickname: response.nickname || '',
          gender: response.gender || 'MALE',
          status: userStatus,
          profilePhoto: response.profilePhoto,
        }
      );

      // 정지된 계정은 /home 이 아니라 정지 안내 화면으로 (모바일 /suspended 와 동일 계약)
      if (userStatus === 'SUSPENDED') {
        router.replace('/suspended');
        return;
      }

      if (response.adultDeclarationRequired) {
        router.replace('/adult-declaration');
        return;
      }

      // 로딩 화면 전환
      setStep('loading');
    } catch (error) {
      setOtpError(getErrorMessage(error));
    } finally {
      setIsRequesting(false);
    }
  };

  if (blockedMessage) {
    return (
      <IdvBlockedScreen
        message={blockedMessage}
        adultAt={blockedAdultAt}
        onSupport={() => window.open('mailto:support@romeoncupid.art', '_self')}
      />
    );
  }

  // 로딩 화면 (호텔 체크인 완료 감성)
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        {/* 골드 스피너 */}
        <div className="w-12 h-12 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin mb-8" />
        <h2 className="text-xl font-bold text-text dark:text-dark-cream mb-2">
          체크인 중입니다
        </h2>
        <p className="text-sm text-subtext dark:text-[var(--subtext)]">
          잠시만 기다려주세요...
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[var(--cupid-idv-border)] bg-[var(--cupid-idv-card)] p-8 shadow-sm">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h2 className="cupid-form-heading mb-1.5">
          {step === 'phone' ? '체크인' : step === 'declaration' ? '성인 확인' : '인증번호 확인'}
        </h2>
        <p className="text-sm text-subtext dark:text-[var(--subtext)]">
          {step === 'phone'
            ? '전화번호로 로그인하세요'
            : step === 'declaration'
              ? '추천과 프로필 표시에 사용할 출생연도를 알려주세요'
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
            className="cupid-form-input px-4 text-center text-lg tracking-wider"
            autoFocus
          />
          <button
            type="button"
            aria-expanded={showPhoneReason}
            onClick={() => setShowPhoneReason((shown) => !shown)}
            className="cupid-chevron-link mt-1 inline-flex items-center gap-1"
          >
            왜 전화번호인가요? <span aria-hidden="true">{showPhoneReason ? '⌃' : '⌄'}</span>
          </button>
          {showPhoneReason && (
            <p className="text-sm leading-6 text-[var(--cupid-idv-text-2)]">
              안전한 본인 확인과 중복 계정 방지를 위해 사용하며, 프로필에는 공개하지 않아요.
            </p>
          )}
          {phoneError && (
            <p className="mt-2 text-xs text-red-500 text-center">{phoneError}</p>
          )}
          <button
            onClick={handleRequestOtp}
            disabled={isRequesting}
            className="cupid-primary-button mt-6 w-full hover:opacity-90 active:opacity-80"
          >
            {isRequesting ? '확인 중...' : '계속하기'}
          </button>
        </div>
      )}

      {/* Step 2: OTP 입력 */}
      {step === 'otp' && (
        <div>
          {/* OTP 6자리 입력 */}
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
                className="cupid-form-input h-14 w-11 text-center text-xl font-bold"
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
            className="cupid-primary-button mt-6 w-full hover:opacity-90 active:opacity-80"
          >
            {isRequesting ? '확인 중...' : '로그인'}
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

      {step === 'declaration' && (
        <div>
          <label className="block text-sm font-medium text-text dark:text-dark-cream mb-2">
            출생연도 4자리
          </label>
          <input
            data-testid="login-birth-year-input"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={birthYear}
            onChange={(event) => { setBirthYear(event.target.value.replace(/\D/g, '').slice(0, 4)); setOtpError(''); }}
            placeholder="1994"
            className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-ivory dark:bg-dark-bg text-text dark:text-dark-cream text-center text-lg tracking-wider focus:outline-none focus:border-gold dark:focus:border-dark-gold"
            autoFocus
          />
          <label className="mt-4 flex min-h-12 items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3 text-sm text-text dark:text-dark-cream">
            <input
              data-testid="login-adult-confirmation"
              type="checkbox"
              checked={declarationConfirmed}
              onChange={(event) => { setDeclarationConfirmed(event.target.checked); setOtpError(''); }}
              className="h-5 w-5 accent-gold"
            />
            저는 이미 만 19세 이상입니다.
          </label>
          <p className="mt-4 text-xs leading-5 text-subtext dark:text-[var(--subtext)]">
            현재는 문자 인증과 자기신고로 성인 여부를 확인합니다. 본인확인 대행사 인증 완료를 뜻하지 않습니다.
          </p>
          {otpError && <p className="mt-2 text-xs text-red-500 text-center">{otpError}</p>}
          <button
            onClick={handleVerifyAndLogin}
            disabled={isRequesting || birthYear.length !== 4 || !declarationConfirmed}
            className="w-full mt-6 py-3.5 rounded-xl bg-gold dark:bg-dark-gold text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? '확인 중...' : '확인하고 로그인하기'}
          </button>
          <button
            onClick={() => { setStep('otp'); setOtpError(''); }}
            className="block mx-auto mt-4 text-sm text-subtext dark:text-[var(--subtext)] hover:text-text dark:hover:text-dark-cream transition-colors"
          >
            인증번호로 돌아가기
          </button>
        </div>
      )}

      {/* 구분선 */}
      <div className="my-8 flex items-center gap-3">
        <div className="flex-1 border-t border-[var(--border)]" />
        <span className="text-sm text-subtext dark:text-[var(--subtext)]">또는</span>
        <div className="flex-1 border-t border-[var(--border)]" />
      </div>

      {/* 회원가입 링크 */}
      <div className="text-center">
        <p className="text-sm text-subtext dark:text-[var(--subtext)]">
          아직 회원이 아니신가요?
        </p>
        <button
          onClick={() => router.push('/signup')}
          className="cupid-chevron-link mt-2 inline-flex items-center justify-center text-gold transition-opacity hover:opacity-80 active:opacity-70 dark:text-dark-gold"
        >
          회원가입
        </button>
      </div>
    </div>
  );
}
