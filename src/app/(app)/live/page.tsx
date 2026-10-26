import { redirect } from 'next/navigation';

// R21 Cupid pivot: 라이브 스와이프 폐지 → /home 리다이렉트 (Apple 4.3(b) 회피, Phase 2 아카이브)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LivePage() {
  redirect('/home');
}
