'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { webLoginBranch, WEB_IDV_UNAVAILABLE_MESSAGE } from '@/lib/authFlow';
import { IdentityVerificationFlow } from '@/components/auth/IdentityVerificationFlow';
import { IdvBlockedScreen } from '@/components/auth/IdvBlockedScreen';

type Gender = 'MALE' | 'FEMALE';
const IDV_HANDOFF_STORAGE_KEY = 'romeo:idv-signup-handoff:v1';
const SMS_SIGNUP_PHONE_STORAGE_KEY = 'romeo:sms-signup-phone:v1';
const INTERVIEW_INTRO_STORAGE_KEY = 'romeo:interview-intro:v1';

interface IdvSignupHandoff {
  phone: string;
  idvSessionId: string;
}

function isValidIdvHandoff(value: unknown): value is IdvSignupHandoff {
  if (!value || typeof value !== 'object') return false;
  const handoff = value as Partial<IdvSignupHandoff>;
  return typeof handoff.phone === 'string'
    && /^01[0-9]\d{7,8}$/.test(handoff.phone)
    && typeof handoff.idvSessionId === 'string'
    && handoff.idvSessionId.length > 0
    && handoff.idvSessionId.length <= 200;
}

 /**
 * 회원가입 페이지: 남/여 분기 가입
 * Step 1: 성별 선택 → Step 2: 닉네임 → Step 3: 전화번호 인증 + 성인 자기신고 또는 PASS → 가입 → 인터뷰
 */
export default function SignupPage() {
  const router = useRouter();
  const loginAction = useAuthStore((state) => state.login);
  const markInterviewIntroPending = useUIStore((state) => state.markInterviewIntroPending);

  // 스텝 관리: 가입 필수정보를 먼저 받고 본인확인 성공 즉시 계정을 만든 뒤 인터뷰로 보낸다.
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: 성별
  const [gender, setGender] = useState<Gender | null>(null);

  // Step 3: 전화번호 인증 + 성인 자기신고 또는 PASS
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [identitySessionId, setIdentitySessionId] = useState('');
  const [signupTicket, setSignupTicket] = useState('');
  const [blockedMessage, setBlockedMessage] = useState('');
  const [blockedAdultAt, setBlockedAdultAt] = useState<string | null>(null);
  const [smsCodeRequested, setSmsCodeRequested] = useState(false);
  const [otp, setOtp] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [adultConfirmed, setAdultConfirmed] = useState(false);

  // Step 2: 닉네임. 출생연도는 SMS 가입일 때 Step 3에서 수집한다.
  const [nickname, setNickname] = useState('');
  const [formError, setFormError] = useState('');

  // 공통 로딩
  const [isRequesting, setIsRequesting] = useState(false);

  // 로그인 단일 문에서 신규 번호로 들어온 경우 같은 본인확인 세션을 이어받는다.
  useEffect(() => {
    let rawHandoff: string | null = null;
    try {
      rawHandoff = window.sessionStorage.getItem(IDV_HANDOFF_STORAGE_KEY);
      // 파싱과 검증 전에 먼저 지워 새로고침과 중복 소비를 fail-closed로 만든다.
      window.sessionStorage.removeItem(IDV_HANDOFF_STORAGE_KEY);
    } catch {
      // 저장소가 정책으로 차단된 브라우저에서는 직접 가입 흐름으로만 진행한다.
      return;
    }
    if (!rawHandoff) return;

    try {
      const handoff: unknown = JSON.parse(rawHandoff);
      if (!isValidIdvHandoff(handoff)) return;
      setPhoneNumber(handoff.phone);
      setIdentitySessionId(handoff.idvSessionId);
    } catch {
      // 변조되거나 깨진 값은 이미 폐기했다. 본인확인 화면으로 진입시키지 않는다.
    }
  }, []);

  useEffect(() => {
    try {
      const smsPhone = window.sessionStorage.getItem(SMS_SIGNUP_PHONE_STORAGE_KEY);
      window.sessionStorage.removeItem(SMS_SIGNUP_PHONE_STORAGE_KEY);
      if (smsPhone && /^01[0-9]\d{7,8}$/.test(smsPhone)) {
        setPhoneNumber(smsPhone);
      }
    } catch {
      // 저장소가 차단돼도 직접 번호 입력으로 진행할 수 있다.
    }
  }, []);

  // 전화번호 포맷
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const isValidPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return /^01[0-9]\d{7,8}$/.test(digits);
  };

  // 가입·재로그인 갈림길 판정. 가입 문자 인증은 호출하지 않는다.
  const handleContinue = async () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (!isValidPhone(phoneNumber)) {
      setPhoneError('올바른 전화번호를 입력해주세요.');
      return;
    }

    setPhoneError('');
    setIsRequesting(true);
    try {
      const branch = webLoginBranch(await authApi.loginStart(digits));
      if (branch.kind === 'blocked') {
        setBlockedMessage(branch.message);
        setBlockedAdultAt(branch.adultAt);
        return;
      }
      if (branch.kind === 'idv') {
        setIdentitySessionId(branch.sessionId);
        return;
      }
      if (branch.kind === 'idv-unavailable') {
        setPhoneError(WEB_IDV_UNAVAILABLE_MESSAGE);
        return;
      }
      if (branch.kind === 'signup') {
        await authApi.requestPhoneVerification(digits, 'SIGNUP');
        setSmsCodeRequested(true);
        return;
      }
      setPhoneError('이미 가입된 번호예요. 로그인 화면에서 문자 6자리로 확인해 주세요.');
    } catch (error) {
      setPhoneError(getErrorMessage(error));
    } finally {
      setIsRequesting(false);
    }
  };

  const restartIdentityVerification = async () => {
    setIsRequesting(true);
    setPhoneError('');
    try {
      const branch = webLoginBranch(await authApi.loginStart(phoneNumber.replace(/\D/g, '')));
      if (branch.kind === 'idv') {
        setIdentitySessionId(branch.sessionId);
        return;
      }
      if (branch.kind === 'blocked') {
        setIdentitySessionId('');
        setBlockedMessage(branch.message);
        setBlockedAdultAt(branch.adultAt);
        return;
      }
      setIdentitySessionId('');
      setPhoneError(branch.kind === 'idv-unavailable' ? WEB_IDV_UNAVAILABLE_MESSAGE : '로그인 화면에서 다시 시작해 주세요.');
    } catch (error) {
      setIdentitySessionId('');
      setPhoneError(getErrorMessage(error));
    } finally {
      setIsRequesting(false);
    }
  };

  // 회원가입 제출
  const handleSignup = async (verifiedTicket = signupTicket) => {
    if (!nickname.trim()) {
      setFormError('닉네임을 입력해주세요.');
      return;
    }
    if (nickname.trim().length < 2 || nickname.trim().length > 10) {
      setFormError('닉네임은 2~10자로 입력해주세요.');
      return;
    }
    const currentYear = new Date().getFullYear();
    const parsedBirthYear = /^\d{4}$/.test(birthYear) ? Number(birthYear) : null;
    if (!verifiedTicket && (otp.length !== 6 || parsedBirthYear === null
      || parsedBirthYear < currentYear - 100
      || parsedBirthYear > currentYear - 19
      || !adultConfirmed)) {
      setFormError(`인증번호, 출생연도, 만 19세 이상 확인이 필요합니다. ${currentYear - 19}년생까지 가입할 수 있습니다.`);
      return;
    }

    setFormError('');
    setIsRequesting(true);
    try {
      if (!verifiedTicket) {
        await authApi.verifyPhone(phoneNumber.replace(/\D/g, ''), otp, 'SIGNUP');
      }
      const response = await authApi.signup({
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        nickname: nickname.trim(),
        gender: gender!,
        ...(verifiedTicket
          ? { signupTicket: verifiedTicket }
          : {
              birthYear: parsedBirthYear!,
              adultDeclaration: {
                confirmedNineteenOrOlder: true as const,
                version: 'adult-self-declaration-v1' as const,
              },
            }),
      });

      // 토큰 저장 및 상태 업데이트
      loginAction(
        {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
        {
          userId: response.userId,
          nickname: nickname.trim(),
          gender: gender!,
          status: gender === 'MALE' ? 'PENDING_APPROVAL' : 'ACTIVE',
        }
      );

      markInterviewIntroPending();
      try {
        window.sessionStorage.setItem(INTERVIEW_INTRO_STORAGE_KEY, 'pending');
      } catch {
        // 비영속 UI handoff가 같은 App Router 세션에서 안내 화면을 보장한다.
      }
      router.push('/interview');
    } catch (error) {
      setFormError(getErrorMessage(error));
      setStep(2);
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

  if (identitySessionId) {
    return (
      <IdentityVerificationFlow
        key={identitySessionId}
        sessionId={identitySessionId}
        onBack={() => setIdentitySessionId('')}
        onRestart={restartIdentityVerification}
        onVerified={(ticket) => {
          setSignupTicket(ticket);
          setIdentitySessionId('');
          if (gender && nickname.trim().length >= 2 && nickname.trim().length <= 10) {
            void handleSignup(ticket);
          } else {
            setStep(1);
          }
        }}
        continueLabel="가입 정보 입력하기"
        onSupport={() => window.open('mailto:support@romeoncupid.art', '_self')}
      />
    );
  }

  // 스텝 진행률 표시
  const stepLabels = ['성별', '프로필', '인증'];

  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl border border-[var(--border)] p-8 shadow-sm">
      {/* 스텝 인디케이터 */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = typeof step === 'number' && step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                  ${isDone ? 'bg-gold dark:bg-dark-gold text-white' : ''}
                  ${isActive ? 'bg-gold dark:bg-dark-gold text-white' : ''}
                  ${!isActive && !isDone ? 'bg-ivory dark:bg-dark-bg text-subtext dark:text-[var(--subtext)] border border-[var(--border)]' : ''}
                `}
              >
                {isDone ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span className={`text-xs hidden sm:inline ${isActive ? 'text-gold dark:text-dark-gold font-semibold' : 'text-subtext dark:text-[var(--subtext)]'}`}>
                {label}
              </span>
              {i < stepLabels.length - 1 && (
                <div className={`w-8 h-px ${isDone ? 'bg-gold dark:bg-dark-gold' : 'bg-[var(--border)]'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: 성별 선택 */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold text-text dark:text-dark-cream text-center mb-2">
            성별을 선택해주세요
          </h2>
          <p className="text-sm text-subtext dark:text-[var(--subtext)] text-center mb-8">
            가입 후 변경할 수 없습니다
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* 여성 카드 */}
            <button
              onClick={() => setGender('FEMALE')}
              className={`
                relative p-6 rounded-2xl border-2 transition-all text-center
                ${gender === 'FEMALE'
                  ? 'border-gold dark:border-dark-gold bg-gold/5 dark:bg-dark-gold/5'
                  : 'border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40'}
              `}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 dark:bg-dark-gold/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-gold dark:text-dark-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <p className="font-bold text-text dark:text-dark-cream">여성</p>
              <p className="text-xs text-subtext dark:text-[var(--subtext)] mt-1">매일 정오 Cupid 추천</p>
              {gender === 'FEMALE' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gold dark:bg-dark-gold flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              )}
            </button>

            {/* 남성 카드 */}
            <button
              onClick={() => setGender('MALE')}
              className={`
                relative p-6 rounded-2xl border-2 transition-all text-center
                ${gender === 'MALE'
                  ? 'border-gold dark:border-dark-gold bg-gold/5 dark:bg-dark-gold/5'
                  : 'border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40'}
              `}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 dark:bg-dark-gold/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-gold dark:text-dark-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <p className="font-bold text-text dark:text-dark-cream">남성</p>
              <p className="text-xs text-subtext dark:text-[var(--subtext)] mt-1">여성 심사 후 활동</p>
              {gender === 'MALE' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gold dark:bg-dark-gold flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              )}
            </button>
          </div>

          <button
            onClick={() => gender && setStep(2)}
            disabled={!gender}
            className="w-full py-3.5 rounded-xl bg-gold dark:bg-dark-gold text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}

      {/* Step 3: 전화번호를 서버에 보내 가입·재로그인 갈림길 판정 */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-bold text-text dark:text-dark-cream text-center mb-2">
            전화번호로 계속하기
          </h2>
          <p className="text-sm text-subtext dark:text-[var(--subtext)] text-center mb-8">
            문자 인증 뒤 출생연도와 만 19세 이상 여부를 확인합니다.
          </p>

          {!smsCodeRequested ? (
            <>
              <label className="block text-sm font-medium text-text dark:text-dark-cream mb-2">전화번호</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="tel"
                  value={formatPhone(phoneNumber)}
                  onChange={(e) => { setPhoneNumber(e.target.value); setPhoneError(''); }}
                  placeholder="010-0000-0000"
                  className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] bg-ivory dark:bg-dark-bg text-text dark:text-dark-cream placeholder:text-subtext/50 focus:outline-none focus:border-gold dark:focus:border-dark-gold transition-colors disabled:opacity-50"
                />
                <button
                  onClick={handleContinue}
                  disabled={isRequesting}
                  className="px-4 py-3 rounded-xl bg-gold dark:bg-dark-gold text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isRequesting ? '확인 중' : '계속하기'}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-text dark:text-dark-cream">
                인증번호 6자리
                <input
                  data-testid="signup-otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => { setOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); setFormError(''); }}
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-ivory dark:bg-dark-bg text-center text-lg tracking-[0.35em] focus:outline-none focus:border-gold dark:focus:border-dark-gold"
                />
              </label>
              <label className="block text-sm font-medium text-text dark:text-dark-cream">
                출생연도를 알려주세요
                <span className="mt-1 block text-xs font-normal text-subtext dark:text-[var(--subtext)]">추천 나이 조건과 프로필 표시에 사용해요.</span>
                <input
                  data-testid="signup-birth-year-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={birthYear}
                  onChange={(event) => { setBirthYear(event.target.value.replace(/\D/g, '').slice(0, 4)); setFormError(''); }}
                  placeholder="출생연도 4자리"
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-ivory dark:bg-dark-bg text-center text-lg tracking-wider focus:outline-none focus:border-gold dark:focus:border-dark-gold"
                />
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3 text-sm text-text dark:text-dark-cream">
                <input
                  data-testid="signup-adult-confirmation"
                  type="checkbox"
                  checked={adultConfirmed}
                  onChange={(event) => { setAdultConfirmed(event.target.checked); setFormError(''); }}
                  className="h-5 w-5 accent-gold"
                />
                저는 이미 만 19세 이상입니다.
              </label>
              <p className="text-xs leading-5 text-subtext dark:text-[var(--subtext)]">현재는 문자 인증과 자기신고로 성인 여부를 확인합니다. 본인확인 대행사 인증 완료를 뜻하지 않습니다.</p>
              <button
                onClick={() => void handleSignup('')}
                disabled={isRequesting || otp.length !== 6 || birthYear.length !== 4 || !adultConfirmed}
                className="w-full py-3.5 rounded-xl bg-gold dark:bg-dark-gold text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequesting ? '가입 중...' : '확인하고 가입하기'}
              </button>
            </div>
          )}
          {phoneError && (
            <p className="text-xs text-red-500 mb-4">{phoneError}</p>
          )}

          {/* 뒤로가기 */}
          <button
            onClick={() => setStep(2)}
            className="block mx-auto mt-6 text-sm text-subtext dark:text-[var(--subtext)] hover:text-text dark:hover:text-dark-cream transition-colors"
          >
            이전 단계로
          </button>
        </div>
      )}

      {/* Step 2: 가입에 필요한 닉네임을 본인확인 전에 확정한다. */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold text-text dark:text-dark-cream text-center mb-2">
            프로필 정보
          </h2>
          <p className="text-sm text-subtext dark:text-[var(--subtext)] text-center mb-8">
            다른 회원에게 보이는 기본 정보입니다
          </p>

          {/* 닉네임 */}
          <label className="block text-sm font-medium text-text dark:text-dark-cream mb-2">
            닉네임
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setFormError('');
            }}
            placeholder="2~10자"
            maxLength={10}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-ivory dark:bg-dark-bg text-text dark:text-dark-cream placeholder:text-subtext/50 focus:outline-none focus:border-gold dark:focus:border-dark-gold transition-colors mb-5"
            autoFocus
          />

          {formError && (
            <p className="text-xs text-red-500 mb-4">{formError}</p>
          )}

          <button
            onClick={() => {
              if (!nickname.trim()) {
                setFormError('닉네임을 입력해주세요.');
                return;
              }
              if (nickname.trim().length < 2 || nickname.trim().length > 10) {
                setFormError('닉네임은 2~10자로 입력해주세요.');
                return;
              }
              if (signupTicket) void handleSignup();
              else setStep(3);
            }}
            disabled={isRequesting}
            className="w-full mt-6 py-3.5 rounded-xl bg-gold dark:bg-dark-gold text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? '가입 중...' : signupTicket ? '가입 계속하기' : '본인확인으로'}
          </button>

          {/* 뒤로가기 */}
          <button
            onClick={() => setStep(1)}
            className="block mx-auto mt-4 text-sm text-subtext dark:text-[var(--subtext)] hover:text-text dark:hover:text-dark-cream transition-colors"
          >
            성별 다시 선택
          </button>
        </div>
      )}

      {/* 구분선 */}
      <div className="my-8 flex items-center gap-3">
        <div className="flex-1 border-t border-[var(--border)]" />
        <span className="text-xs text-subtext dark:text-[var(--subtext)]">또는</span>
        <div className="flex-1 border-t border-[var(--border)]" />
      </div>

      {/* 로그인 링크 */}
      <div className="text-center">
        <p className="text-sm text-subtext dark:text-[var(--subtext)]">
          이미 회원이신가요?
        </p>
        <button
          onClick={() => router.push('/login')}
          className="mt-2 text-sm font-semibold text-gold dark:text-dark-gold hover:opacity-80 transition-opacity"
        >
          로그인
        </button>
      </div>
    </div>
  );
}
