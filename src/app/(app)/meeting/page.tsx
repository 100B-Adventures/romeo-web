import { redirect } from 'next/navigation';

// R21 Cupid pivot: 만남 게시판 폐지 → /home 리다이렉트 (Phase 2 아카이브, 코드 보존)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function MeetingPage() {
  redirect('/home');
}
