'use client';

// vNext v39: 운영자 게시글 상세(읽기 전용). 목록과 같은 이유로 리다이렉트 스텁을 걷었다.
// 댓글·좋아요·신고는 결정 8 대로 회원 화면에 두지 않는다.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { communityApi, type CommunityPost } from '@/lib/api/community';

export default function CommunityPostPage() {
  const params = useParams<{ id: string }>();
  const postId = Number(params?.id);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(postId)) { setError('잘못된 주소예요.'); setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try {
      setPost(await communityApi.getPostById(postId));
    } catch {
      setError('소식을 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-24 pt-8" data-testid="community-detail">
      <Link href="/community" className="text-sm text-[var(--cupid-idv-text-2)]">← 큐피드의 소식</Link>
      {isLoading ? (
        <p className="mt-10 text-center text-sm text-[var(--cupid-idv-text-2)]">불러오는 중이에요</p>
      ) : error || !post ? (
        <p className="mt-10 text-center text-sm text-[var(--cupid-idv-text-2)]" data-testid="community-detail-error">
          {error ?? '소식을 찾을 수 없어요.'}
        </p>
      ) : (
        <article className="mt-6">
          <p className="text-[11px] font-bold tracking-[0.12em] text-[var(--cupid-idv-gold)]">Cupid</p>
          <h1 className="mt-3 font-serif text-2xl leading-snug text-[var(--cupid-idv-text)]">{post.title}</h1>
          <p className="mt-2 text-xs text-[var(--cupid-idv-muted)]">
            {new Date(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="mt-6 whitespace-pre-wrap text-sm leading-[1.8] text-[var(--cupid-idv-text)]">{post.content}</div>
        </article>
      )}
    </main>
  );
}
