'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { profileApi, VerificationItemResponse } from '@/lib/api/profile';
import { fileApi } from '@/lib/api/file';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { selectVerificationItem } from '@/lib/verificationState';

// 인증 종류 정의
const VERIFICATION_TYPES = [
  {
    type: 'IDENTITY',
    label: '신원인증',
    description: '신분증 (주민등록증, 운전면허증, 여권)',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
      </svg>
    ),
  },
  {
    type: 'EDUCATION',
    label: '학력인증',
    description: '졸업증명서, 재학증명서',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    type: 'INCOME',
    label: '소득인증',
    description: '소득금액증명원, 급여명세서',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: 'CAREER',
    label: '직업인증',
    description: '재직증명서, 사업자등록증',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    type: 'RESIDENCE',
    label: '거주지인증',
    description: '주민등록등본, 공과금 고지서',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
];

// 상태별 스타일/라벨
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  NONE: { label: '미인증', color: 'text-gray-400 dark:text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800' },
  PENDING: { label: '심사중', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
  APPROVED: { label: '인증완료', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  REJECTED: { label: '반려', color: 'text-red-500 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' },
};

/**
 * 인증 뱃지 관리 페이지
 * 5종 인증 상태 표시 + 서류 업로드 + 메모 입력 + 반려 사유 표시
 */
export default function VerificationPage() {
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);
  const [verifications, setVerifications] = useState<VerificationItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  // 인증 목록 로드
  const fetchVerifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await profileApi.getMyVerifications();
      setVerifications(data);
    } catch (err) {
      // 인증 정보 없을 수 있음 (빈 배열 처리)
      setVerifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // 해당 타입의 인증 데이터 조회
  const getVerificationItem = (type: string): VerificationItemResponse | undefined => {
    return selectVerificationItem(verifications, type);
  };

  // 서류 업로드 + 메모 제출 처리
  const handleSubmit = async (type: string, file: File, memo?: string) => {
    setUploadingType(type);
    try {
      // 1. 파일 업로드
      const documentUrl = await fileApi.uploadImage(file);
      // 2. 인증 제출 (메모 포함)
      await profileApi.submitVerification(type, documentUrl, memo || undefined);
      showToast('서류가 제출되었습니다. 심사까지 1~2 영업일 소요됩니다.');
      await fetchVerifications();
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setUploadingType(null);
    }
  };

  // 로딩
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
        <p className="mt-4 text-sm text-subtext dark:text-[var(--subtext)]">인증 정보를 불러오는 중...</p>
      </div>
    );
  }

  // 완료된 인증 수
  const approvedCount = VERIFICATION_TYPES.filter(
    (v) => (getVerificationItem(v.type)?.status || 'NONE') === 'APPROVED'
  ).length;

  return (
    <div className="px-4 py-4">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-subtext dark:text-[var(--subtext)]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text dark:text-dark-cream">인증 관리</h1>
        <div className="w-6" />
      </div>

      {/* 인증 현황 요약 */}
      <div className="mb-6 p-5 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text dark:text-dark-cream">인증 현황</h2>
            <p className="text-xs text-subtext dark:text-[var(--subtext)] mt-1">
              인증이 많을수록 매칭 확률이 높아집니다
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-gold dark:text-dark-gold">{approvedCount}</span>
            <span className="text-sm text-subtext dark:text-[var(--subtext)]">/ 5</span>
          </div>
        </div>
        {/* 프로그레스 바 */}
        <div className="mt-3 w-full h-2 bg-ivory dark:bg-dark-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold rounded-full transition-all duration-500"
            style={{ width: `${(approvedCount / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* 인증 항목 목록 */}
      <div className="flex flex-col gap-3">
        {VERIFICATION_TYPES.map((item) => {
          const verificationItem = getVerificationItem(item.type);
          const status = verificationItem?.status || 'NONE';
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.NONE;
          const isUploading = uploadingType === item.type;

          return (
            <VerificationCard
              key={item.type}
              type={item.type}
              label={item.label}
              description={item.description}
              icon={item.icon}
              status={status}
              statusLabel={config.label}
              statusColor={config.color}
              statusBgColor={config.bgColor}
              reviewMemo={verificationItem?.reviewMemo}
              isUploading={isUploading}
              onSubmit={(file, memo) => handleSubmit(item.type, file, memo)}
            />
          );
        })}
      </div>

      {/* 안내 사항 */}
      <div className="mt-8 p-4 rounded-2xl bg-ivory dark:bg-dark-bg">
        <h3 className="text-xs font-bold text-text dark:text-dark-cream mb-2">안내 사항</h3>
        <ul className="text-xs text-subtext dark:text-[var(--subtext)] space-y-1.5 leading-relaxed">
          <li>- 제출하신 서류는 심사 완료 후 즉시 삭제됩니다.</li>
          <li>- 심사는 보통 1~2 영업일 내에 완료됩니다.</li>
          <li>- 개인정보(주민등록번호 뒷자리 등)는 마스킹 후 제출해주세요.</li>
          <li>- 반려된 인증은 사유를 확인 후 재제출 가능합니다.</li>
        </ul>
      </div>
    </div>
  );
}

/** 인증 카드 컴포넌트 */
function VerificationCard({
  type,
  label,
  description,
  icon,
  status,
  statusLabel,
  statusColor,
  statusBgColor,
  reviewMemo,
  isUploading,
  onSubmit,
}: {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: string;
  statusLabel: string;
  statusColor: string;
  statusBgColor: string;
  reviewMemo?: string;
  isUploading: boolean;
  onSubmit: (file: File, memo?: string) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 제출 폼 표시 여부
  const [showForm, setShowForm] = useState(false);
  // 선택된 파일
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // 메모 입력
  const [memo, setMemo] = useState('');

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 제출 핸들러
  const handleFormSubmit = async () => {
    if (!selectedFile) return;
    // 폼 초기화는 제출 완료 후 수행 (에러 시 폼 유지)
    try {
      await onSubmit(selectedFile, memo.trim() || undefined);
      setShowForm(false);
      setSelectedFile(null);
      setMemo('');
    } catch {
      // 에러는 부모 handleSubmit에서 처리됨 — 폼을 유지하여 재시도 가능
    }
  };

  // 폼 취소
  const handleCancel = () => {
    setShowForm(false);
    setSelectedFile(null);
    setMemo('');
  };

  // 업로드 가능 여부 (미인증 또는 반려된 경우)
  const canUpload = status === 'NONE' || status === 'REJECTED';

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-[var(--border)]">
      <div className="flex items-center gap-4">
        {/* 아이콘 */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          status === 'APPROVED'
            ? 'bg-gold/10 dark:bg-dark-gold/10 text-gold dark:text-dark-gold'
            : 'bg-ivory dark:bg-dark-bg text-subtext dark:text-[var(--subtext)]'
        }`}>
          {icon}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-text dark:text-dark-cream">{label}</h3>
          <p className="text-xs text-subtext dark:text-[var(--subtext)] mt-0.5">{description}</p>
        </div>

        {/* 상태 뱃지 */}
        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full flex-shrink-0 ${statusBgColor} ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* 반려 사유 표시 */}
      {status === 'REJECTED' && reviewMemo && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
            <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">반려 사유</p>
            <p className="text-xs text-red-500 dark:text-red-300 leading-relaxed">{reviewMemo}</p>
          </div>
        </div>
      )}

      {/* 제출 버튼 (미인증/반려 시, 폼 미표시 상태) */}
      {canUpload && !showForm && !isUploading && (
        <div className={`mt-3 pt-3 ${status !== 'REJECTED' || !reviewMemo ? 'border-t border-[var(--border)]' : ''}`}>
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-2.5 rounded-xl border border-gold dark:border-dark-gold text-gold dark:text-dark-gold text-sm font-medium hover:bg-gold/5 dark:hover:bg-dark-gold/5 transition-colors"
          >
            {status === 'REJECTED' ? '재제출하기' : '서류 제출하기'}
          </button>
        </div>
      )}

      {/* 업로드 진행 중 표시 */}
      {isUploading && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-center gap-2 py-3">
            <div className="w-5 h-5 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
            <span className="text-sm text-gold dark:text-dark-gold font-medium">서류 제출 중...</span>
          </div>
        </div>
      )}

      {/* 제출 폼 (인라인) */}
      {canUpload && showForm && !isUploading && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <div className="space-y-3">
            {/* 파일 선택 */}
            <div>
              <label className="block text-xs font-medium text-subtext dark:text-[var(--subtext)] mb-1.5">
                인증 서류
              </label>
              {selectedFile ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-ivory dark:bg-dark-bg border border-[var(--border)]">
                  <svg className="w-5 h-5 text-gold dark:text-dark-gold flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="flex-1 text-xs text-text dark:text-dark-cream truncate">
                    {selectedFile.name}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      fileInputRef.current?.click();
                    }}
                    className="text-xs text-gold dark:text-dark-gold font-medium flex-shrink-0"
                  >
                    변경
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-gold/30 dark:border-dark-gold/30 hover:border-gold dark:hover:border-dark-gold transition-colors"
                >
                  <svg className="w-5 h-5 text-gold dark:text-dark-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm text-gold dark:text-dark-gold font-medium">파일 선택</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* 메모 입력 */}
            <div>
              <label className="block text-xs font-medium text-subtext dark:text-[var(--subtext)] mb-1.5">
                메모 (선택)
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="추가 설명이 필요한 경우 입력해주세요..."
                maxLength={200}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-ivory dark:bg-dark-bg border border-[var(--border)] focus:border-gold dark:focus:border-dark-gold focus:outline-none text-xs text-text dark:text-dark-cream placeholder-subtext/40 dark:placeholder-[var(--subtext)]/40 resize-none transition-colors"
              />
              <p className="text-right text-[10px] text-subtext dark:text-[var(--subtext)] mt-0.5">
                {memo.length}/200
              </p>
            </div>

            {/* 제출/취소 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-subtext dark:text-[var(--subtext)] text-sm font-medium hover:bg-ivory dark:hover:bg-dark-bg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleFormSubmit}
                disabled={!selectedFile}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold text-white text-sm font-bold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                제출하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 심사중 안내 */}
      {status === 'PENDING' && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            심사가 진행 중입니다. 잠시만 기다려주세요.
          </p>
        </div>
      )}
    </div>
  );
}
