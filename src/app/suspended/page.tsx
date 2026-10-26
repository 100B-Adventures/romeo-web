'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

// vNext v39 45-suspended.png 이관. 모바일 mobile/app/suspended.tsx 와 동일 계약.
// 로그인 응답 status=SUSPENDED 인 회원은 /home 이 아니라 이 화면으로 와야 한다
// (교차 코드리뷰 지적: 웹은 SUSPENDED 저장 후 /home 으로 보내던 결함).
export default function SuspendedPage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleContact = () => {
    router.push('/support');
  };

  const leaveAccount = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-white dark:bg-dark-bg">
      <div className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full border border-red-400 text-red-500">
        <span className="text-2xl font-bold">!</span>
      </div>
      <p className="text-[10px] font-extrabold tracking-[0.3em] text-red-500">이용 정지</p>
      <h1 className="mt-3 text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
        계정이 잠시
        <br />
        정지됐어요
      </h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        신고 접수로 운영팀이 검토 중입니다. 소명할 내용이 있으면 아래로 알려주세요.
        기준을 완화하지는 않지만, 사실 확인은 반드시 합니다.
      </p>
      <button
        type="button"
        onClick={handleContact}
        className="mt-7 w-full max-w-[280px] rounded-xl bg-gold dark:bg-dark-gold py-3.5 text-sm font-extrabold text-white"
      >
        소명 접수하기
      </button>
      <button
        type="button"
        onClick={leaveAccount}
        className="mt-3 w-full max-w-[280px] rounded-xl border border-gold dark:border-dark-gold py-3 text-sm font-extrabold text-gold dark:text-dark-gold"
      >
        로그아웃
      </button>
    </div>
  );
}
