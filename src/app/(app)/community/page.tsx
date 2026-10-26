'use client';

// vNext v39 프레임 43-community.png. 결정 8과 FRD v16 §7.1: 회원 화면은 운영자 게시 읽기 전용이다.
// 2026-09-09 이전에는 이 자리가 /home 리다이렉트 스텁이었다. 그래서 하단바에 커뮤니티 탭이
// 버젓이 있는데 누르면 홈으로 튕겼다. 앱은 같은 화면을 이미 구현해 두었으므로(mobile/app/(tabs)/community.tsx)
// 웹만 뒤처져 있던 것이고, 승인 시안 기준으로 되살린다. 글쓰기·댓글은 여전히 없다.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { communityApi, type CommunityPost } from '@/lib/api/community';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await communityApi.getPosts(0, 20);
      setPosts(page.content ?? []);
    } catch {
      setError('큐피드의 소식을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-24 pt-8" data-testid="community-page">
      <header className="border-b border-[var(--cupid-idv-border)] pb-6">
        <p className="text-[10px] font-bold tracking-[0.25em] text-[var(--cupid-idv-gold)]">NOTICE</p>
        <h1 className="mt-3 font-serif text-3xl text-[var(--cupid-idv-text)]">큐피드의 소식</h1>
        <p className="mt-3 text-sm leading-[1.7] text-[var(--cupid-idv-text-2)]">
          후기와 공지를 큐피드가 직접 올립니다. 회원님의 이름은 어디에도 실리지 않아요.
        </p>
      </header>

      {isLoading ? (
        <p className="mt-10 text-center text-sm text-[var(--cupid-idv-text-2)]" data-testid="community-loading">
          큐피드의 소식을 불러오고 있어요
        </p>
      ) : error ? (
        <div className="mt-10 text-center" data-testid="community-error">
          <p className="text-sm text-[var(--cupid-idv-text-2)]">{error}</p>
          <button type="button" onClick={() => void load()}
            className="mt-4 rounded border border-[var(--cupid-idv-border)] px-4 py-2 text-sm text-[var(--cupid-idv-text)]">
            다시 시도
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="mt-14 text-center" data-testid="community-empty">
          <p className="font-serif text-xl text-[var(--cupid-idv-text)]">아직 올라온 소식이 없어요</p>
          <p className="mt-3 text-sm leading-[1.7] text-[var(--cupid-idv-text-2)]">
            큐피드가 후기와 공지를 이 지면에 올립니다. 첫 소식이 준비되면 알림으로 알려드릴게요.
          </p>
          <Link href="/home"
            className="mt-6 inline-block rounded border border-[var(--cupid-idv-border)] px-4 py-2 text-sm text-[var(--cupid-idv-text)]">
            오늘의 지면으로
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3" data-testid="community-list">
          {posts.map((post, index) => (
            <li key={post.id}>
              <Link href={`/community/${post.id}`} data-testid={`community-post-${post.id}`}
                className="block rounded border border-[var(--cupid-idv-border)] p-5 transition-colors hover:border-[var(--cupid-idv-gold)]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-[0.12em] text-[var(--cupid-idv-gold)]">Cupid</span>
                  <span className="rounded-sm border border-[var(--cupid-idv-border)] px-2 py-[2px] text-[10px] text-[var(--cupid-idv-text-2)]">
                    {index === 0 ? '공지' : '후기'}
                  </span>
                </div>
                <h2 className="mt-3 font-serif text-lg text-[var(--cupid-idv-text)]">{post.title}</h2>
                <p className="mt-2 line-clamp-4 text-sm leading-[1.7] text-[var(--cupid-idv-text-2)]">{post.content}</p>
                <p className="mt-3 text-xs text-[var(--cupid-idv-muted)]">{formatDate(post.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
