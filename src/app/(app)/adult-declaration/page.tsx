'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { profileApi } from '@/lib/api/profile';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { useAuthStore } from '@/store/authStore';

export default function AdultDeclarationPage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [birthYear, setBirthYear] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const currentYear = new Date().getFullYear();
    const parsed = /^\d{4}$/.test(birthYear) ? Number(birthYear) : null;
    if (parsed === null || parsed < currentYear - 100 || parsed > currentYear - 19 || !confirmed) {
      setError(`출생연도와 만 19세 이상 확인이 필요합니다. ${currentYear - 19}년생까지 이용할 수 있습니다.`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await profileApi.declareAdult(parsed);
      router.replace('/home');
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-6 py-12" data-testid="adult-declaration-page">
      <section className="w-full border border-[var(--cupid-idv-border)] bg-[var(--cupid-idv-bg)] p-8">
        <p className="text-xs font-bold tracking-[0.18em] text-[var(--cupid-idv-gold)]">ADULT DECLARATION</p>
        <h1 className="mt-4 font-serif text-3xl text-[var(--cupid-idv-text)]">출생연도를 알려주세요</h1>
        <p className="mt-4 text-base leading-7 text-[var(--cupid-idv-text-2)]">추천 나이 조건과 프로필 표시에 사용해요.</p>
        <label className="mt-8 block text-sm font-bold text-[var(--cupid-idv-text)]" htmlFor="birthYear">출생연도 4자리</label>
        <input id="birthYear" inputMode="numeric" maxLength={4} value={birthYear}
          onChange={(event) => setBirthYear(event.target.value.replace(/\D/g, ''))}
          className="mt-2 min-h-12 w-full border border-[var(--cupid-idv-border)] bg-transparent px-4 text-base text-[var(--cupid-idv-text)]"
          data-testid="adult-declaration-birth-year" />
        <label className="mt-6 flex min-h-12 items-center gap-3 text-base text-[var(--cupid-idv-text)]">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}
            className="h-6 w-6" data-testid="adult-declaration-confirmed" />
          저는 이미 만 19세 이상입니다.
        </label>
        <p className="mt-5 text-sm leading-6 text-[var(--cupid-idv-text-2)]">현재는 문자 인증과 자기신고로 성인 여부를 확인합니다. 본인확인 대행사 인증 완료를 뜻하지 않습니다.</p>
        {error ? <p className="mt-4 text-sm text-[var(--cupid-idv-danger)]" role="alert">{error}</p> : null}
        <button type="button" disabled={submitting} onClick={submit}
          className="mt-8 min-h-12 w-full bg-[var(--cupid-idv-accent)] px-5 text-base font-bold text-white disabled:opacity-50"
          data-testid="adult-declaration-submit">{submitting ? '확인 중' : '확인하고 추천 보기'}</button>
        <div className="mt-4 grid gap-2">
          <button type="button" onClick={() => router.push('/profile/settings')}
            className="min-h-12 w-full border border-[var(--cupid-idv-border)] px-5 text-base font-bold text-[var(--cupid-idv-text)]"
            data-testid="adult-declaration-settings">설정 및 회원 탈퇴</button>
          <button type="button" onClick={handleLogout}
            className="min-h-12 w-full px-5 text-base font-bold text-[var(--cupid-idv-text-2)]"
            data-testid="adult-declaration-logout">로그아웃</button>
        </div>
      </section>
    </main>
  );
}
