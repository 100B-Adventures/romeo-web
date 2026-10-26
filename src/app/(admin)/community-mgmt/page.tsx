'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils/errorHandler';

// 커뮤니티 게시글 응답 타입
interface CommunityPostItem {
  postId: number;
  content: string;
  authorNickname: string;
  authorAnonymousName: string;
  authorGender: string;
  authorUserId?: number;
  commentCount: number;
  likeCount: number;
  createdAt: string;
}

// 댓글 응답 타입
interface CommunityCommentItem {
  id: number;
  postId: number;
  parentCommentId?: number | null;
  authorAnonymousName: string;
  authorNickname?: string;
  authorUserId?: number;
  authorGender?: string;
  content: string;
  isDeleted?: boolean;
  createdAt: string;
}

// 유저 상세 팝업용 타입
interface UserDetailInfo {
  userId: number;
  nickname?: string;
  phoneNumber?: string;
  gender?: string;
  status?: string;
  role?: string;
  createdAt?: string;
  verified?: boolean;
  [key: string]: unknown;
}

/**
 * 관리자 커뮤니티 관리 페이지 — 게시글 목록 + 댓글 조회 + 삭제 기능
 */
export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<{ content: CommunityPostItem[]; totalElements: number; totalPages: number; first: boolean; last: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // R21: 댓글 패널 상태
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [comments, setComments] = useState<CommunityCommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // R13-11: 유저 상세 팝업 상태
  const [userDetailModal, setUserDetailModal] = useState<UserDetailInfo | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  // 삭제 확인 모달
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'post' | 'comment'; id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 수정 상태
  const [editTarget, setEditTarget] = useState<{ type: 'post' | 'comment'; id: number; postId?: number } | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // 토스트
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 닉네임 클릭 → 유저 실정보 팝업
  const handleUserClick = async (userId: number) => {
    setUserDetailLoading(true);
    setUserDetailModal(null);
    try {
      const detail = await adminApi.getUserDetail(userId);
      setUserDetailModal(detail);
    } catch (err) {
      setUserDetailModal({ userId, nickname: '조회 실패', phoneNumber: getErrorMessage(err) });
    } finally {
      setUserDetailLoading(false);
    }
  };

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getCommunityPosts(page, PAGE_SIZE);
      setPosts(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 토스트 자동 닫기
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // R21: 게시글 클릭 → 댓글 로드
  const handlePostClick = async (postId: number) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      setComments([]);
      return;
    }
    setExpandedPostId(postId);
    setCommentsLoading(true);
    try {
      const data = await adminApi.getCommunityComments(postId);
      setComments(data.content || []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // R21: 삭제 실행
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'post') {
        await adminApi.deleteCommunityPost(deleteTarget.id);
        setToast({ message: `게시글 #${deleteTarget.id} 삭제 완료`, type: 'success' });
        setExpandedPostId(null);
        fetchPosts();
      } else {
        await adminApi.deleteCommunityComment(deleteTarget.id);
        setToast({ message: `댓글 #${deleteTarget.id} 삭제 완료`, type: 'success' });
        // 댓글 목록 갱신
        setComments((prev) => prev.map((c) =>
          c.id === deleteTarget.id ? { ...c, content: '삭제된 댓글입니다', isDeleted: true } : c
        ));
      }
    } catch (err) {
      setToast({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // 수정 모달 열기 — 게시글
  const openEditPost = (post: CommunityPostItem) => {
    setEditTarget({ type: 'post', id: post.postId });
    setEditTitle(''); // 게시글에 title이 없으면 빈 값
    setEditContent(post.content);
  };

  // 수정 모달 열기 — 댓글
  const openEditComment = (comment: CommunityCommentItem) => {
    setEditTarget({ type: 'comment', id: comment.id, postId: comment.postId });
    setEditContent(comment.content);
  };

  // 수정 저장
  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      if (editTarget.type === 'post') {
        await adminApi.updateCommunityPost(editTarget.id, editTitle, editContent);
        setToast({ message: `게시글 #${editTarget.id} 수정 완료`, type: 'success' });
        fetchPosts();
      } else {
        await adminApi.updateCommunityComment(editTarget.id, editContent);
        setToast({ message: `댓글 #${editTarget.id} 수정 완료`, type: 'success' });
        // 댓글 목록 로컬 업데이트
        setComments((prev) => prev.map((c) =>
          c.id === editTarget.id ? { ...c, content: editContent } : c
        ));
      }
      setEditTarget(null);
    } catch (err) {
      setToast({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setEditSaving(false);
    }
  };

  // 날짜 포매팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">커뮤니티 관리</h1>
        {posts && (
          <span className="text-sm text-gray-500">
            총 {posts.totalElements.toLocaleString()}건
          </span>
        )}
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">게시글을 불러오는 중...</p>
        </div>
      )}

      {/* 에러 */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <button
            onClick={fetchPosts}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 게시글 테이블 */}
      {!loading && !error && posts && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">내용</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">작성자(익명)</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">실제 작성자</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">성별</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">댓글</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">좋아요</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">작성일</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.content.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                      게시글이 없습니다.
                    </td>
                  </tr>
                ) : (
                  posts.content.map((post) => (
                    <>
                      <tr
                        key={post.postId}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedPostId === post.postId ? 'bg-blue-50' : ''}`}
                        onClick={() => handlePostClick(post.postId)}
                      >
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{post.postId}</td>
                        <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{post.content}</td>
                        <td className="px-4 py-3 text-gray-600">{post.authorAnonymousName || '-'}</td>
                        <td className="px-4 py-3">
                          {post.authorUserId ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUserClick(post.authorUserId!); }}
                              className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium cursor-pointer bg-transparent border-none p-0"
                            >
                              {post.authorNickname || `유저 #${post.authorUserId}`}
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            post.authorGender === 'MALE' ? 'bg-sky-100 text-sky-700' :
                            post.authorGender === 'FEMALE' ? 'bg-pink-100 text-pink-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {post.authorGender === 'MALE' ? '남성' : post.authorGender === 'FEMALE' ? '여성' : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <span className={`${post.commentCount > 0 ? 'text-blue-600 font-medium' : ''}`}>
                            {post.commentCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{post.likeCount}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(post.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditPost(post);
                              }}
                              className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({ type: 'post', id: post.postId, label: `게시글 #${post.postId}` });
                              }}
                              className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* R21: 댓글 패널 */}
                      {expandedPostId === post.postId && (
                        <tr key={`comments-${post.postId}`}>
                          <td colSpan={9} className="px-4 py-3 bg-gray-50">
                            <div className="ml-6 border-l-2 border-blue-200 pl-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                댓글 목록 ({post.commentCount}건)
                              </h4>
                              {commentsLoading ? (
                                <div className="flex items-center gap-2 py-3">
                                  <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                                  <span className="text-xs text-gray-500">댓글 로딩 중...</span>
                                </div>
                              ) : comments.length === 0 ? (
                                <p className="text-xs text-gray-400 py-2">댓글이 없습니다.</p>
                              ) : (
                                <div className="space-y-2">
                                  {comments.map((comment) => (
                                    <div
                                      key={comment.id}
                                      className={`flex items-start justify-between p-3 rounded-lg ${
                                        comment.parentCommentId ? 'ml-6 bg-white border border-gray-100' : 'bg-white border border-gray-200'
                                      } ${comment.isDeleted ? 'opacity-50' : ''}`}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          {comment.parentCommentId && (
                                            <span className="text-[10px] text-blue-500 font-medium">답글</span>
                                          )}
                                          <span className="text-xs text-gray-500">{comment.authorAnonymousName}</span>
                                          {comment.authorNickname && (
                                            <span className="text-xs text-blue-600">({comment.authorNickname})</span>
                                          )}
                                          {comment.authorUserId && (
                                            <span className="text-[10px] text-gray-400">#{comment.authorUserId}</span>
                                          )}
                                          <span className="text-[10px] text-gray-400">{formatDate(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-sm text-gray-800 break-words">
                                          {comment.content}
                                        </p>
                                      </div>
                                      {!comment.isDeleted && (
                                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openEditComment(comment);
                                            }}
                                            className="px-2 py-1 text-[10px] font-medium text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                                          >
                                            수정
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setDeleteTarget({ type: 'comment', id: comment.id, label: `댓글 #${comment.id}` });
                                            }}
                                            className="px-2 py-1 text-[10px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                          >
                                            삭제
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {posts.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500">
                {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, posts.totalElements)}
                {' / '}{posts.totalElements.toLocaleString()}건
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={posts.first}
                  className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-xs text-gray-700 font-medium">
                  {page + 1} / {posts.totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(posts.totalPages - 1, page + 1))}
                  disabled={posts.last}
                  className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">삭제 확인</h3>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-bold text-red-600">{deleteTarget.label}</span>을(를) 삭제하시겠습니까?
              {deleteTarget.type === 'post' && (
                <span className="block mt-1 text-xs text-gray-400">게시글 삭제 시 연관 댓글도 함께 삭제됩니다.</span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* R13-11: 유저 실정보 팝업 모달 */}
      {(userDetailModal || userDetailLoading) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setUserDetailModal(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">유저 실제 정보</h3>
              <button onClick={() => setUserDetailModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            {userDetailLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : userDetailModal && (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">유저 ID</span>
                  <span className="text-sm font-medium text-gray-900">{userDetailModal.userId}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">닉네임</span>
                  <span className="text-sm font-medium text-gray-900">{userDetailModal.nickname || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">전화번호</span>
                  <span className="text-sm font-medium text-gray-900">{userDetailModal.phoneNumber || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">성별</span>
                  <span className={`text-sm font-medium ${userDetailModal.gender === 'MALE' ? 'text-sky-700' : userDetailModal.gender === 'FEMALE' ? 'text-pink-700' : 'text-gray-500'}`}>
                    {userDetailModal.gender === 'MALE' ? '남성' : userDetailModal.gender === 'FEMALE' ? '여성' : '-'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">상태</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    userDetailModal.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    userDetailModal.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {userDetailModal.status || '-'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">역할</span>
                  <span className="text-sm font-medium text-gray-900">{userDetailModal.role || '-'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-500">가입일</span>
                  <span className="text-sm font-medium text-gray-900">
                    {userDetailModal.createdAt ? new Date(userDetailModal.createdAt).toLocaleDateString('ko-KR') : '-'}
                  </span>
                </div>
                {/* 유저 상세 페이지 링크 */}
                <div className="pt-3 border-t border-gray-200">
                  <Link
                    href={`/users/${userDetailModal.userId}`}
                    className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    유저 상세 페이지로 이동 &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setEditTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editTarget.type === 'post' ? '게시글' : '댓글'} 수정
              <span className="text-sm font-normal text-gray-400 ml-2">#{editTarget.id}</span>
            </h3>

            {/* 게시글 수정 시 제목 필드 */}
            {editTarget.type === 'post' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 (선택)</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="제목 (비워두면 기존 제목 유지)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* 내용 */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditTarget(null)}
                disabled={editSaving}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving || !editContent.trim()}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {editSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
