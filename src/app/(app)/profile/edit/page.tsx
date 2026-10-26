'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { profileApi, ProfileDetailResponse, UpdateProfileRequest } from '@/lib/api/profile';
import { fileApi } from '@/lib/api/file';
import { getErrorMessage } from '@/lib/utils/errorHandler';

// 선택 옵션 상수
const LOCATIONS = ['강남', '서초', '송파', '마포', '성동', '용산', '강서', '기타'];
const MALE_BODY_TYPES = ['슬림', '보통', '근육질', '통통'];
const FEMALE_BODY_TYPES = ['슬림', '보통', '글래머', '통통'];
const RELIGIONS = ['무교', '기독교', '천주교', '불교', '기타'];
const SMOKING_OPTIONS = ['비흡연', '흡연', '가끔'];
// 흡연 한글↔enum 매핑 (백엔드 SmokingStatus)
const SMOKING_TO_ENUM: Record<string, string> = { '비흡연': 'NON_SMOKER', '흡연': 'SMOKER', '가끔': 'OCCASIONAL' };
const SMOKING_FROM_ENUM: Record<string, string> = { 'NON_SMOKER': '비흡연', 'SMOKER': '흡연', 'OCCASIONAL': '가끔' };
const DRINKING_OPTIONS = ['안함', '가끔', '자주'];
const PERSONALITY_OPTIONS = ['외향적', '내향적', '활발한', '차분한', '유머러스', '진지한', '낭만적', '현실적'];
const HOBBY_OPTIONS = ['운동', '여행', '맛집', '카페', '영화', '독서', '음악', '게임', '요리', '반려동물'];

/**
 * 프로필 수정 페이지
 * 15+ 필드 폼: 닉네임, 생년월일, 지역, 키, 체형, 종교 등
 * 호텔 감성 디자인: 골드 액센트, 아이보리 배경
 */
export default function ProfileEditPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const showToast = useUIStore((state) => state.showToast);

  // 성별에 따른 체형 옵션
  const bodyTypeOptions = user?.gender === 'FEMALE' ? FEMALE_BODY_TYPES : MALE_BODY_TYPES;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 폼 상태
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [height, setHeight] = useState<number | ''>('');
  const [bodyType, setBodyType] = useState('');
  const [religion, setReligion] = useState('');
  const [smoking, setSmoking] = useState('');
  const [drinking, setDrinking] = useState('');
  const [school, setSchool] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [personalities, setPersonalities] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [iHave, setIHave] = useState<string[]>([]);
  const [iWant, setIWant] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  // 태그 입력 상태
  const [iHaveInput, setIHaveInput] = useState('');
  const [iWantInput, setIWantInput] = useState('');

  // 사진 업로드 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 기존 프로필 로드
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await profileApi.getMyProfile();
      setNickname(data.nickname || '');
      setBirthYear(data.birthYear || '');
      setLocation(data.location || '');
      setHeight(data.height || '');
      setBodyType(data.bodyType || '');
      setReligion(data.religion || '');
      setSmoking((data.smoking && SMOKING_FROM_ENUM[data.smoking]) || data.smoking || '');
      setDrinking(data.drinking || '');
      setSchool(data.school || '');
      setOccupation(data.occupation || '');
      setBio(data.bio || '');
      setPersonalities(data.personalities || []);
      setHobbies(data.hobbies || []);
      setIHave(data.iHave || []);
      setIWant(data.iWant || []);
      setPhotoUrls(data.photoUrls || []);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 사진 업로드 핸들러
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        const url = await fileApi.uploadImage(file);
        setPhotoUrls((prev) => [...prev, url]);
      } catch (err) {
        showToast('사진 업로드에 실패했습니다.');
      }
    }
    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 사진 삭제
  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // 사진 순서 변경 (위로)
  const movePhotoUp = (index: number) => {
    if (index === 0) return;
    setPhotoUrls((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  // 칩 토글 (multi-select)
  const toggleChip = (
    value: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // 태그 추가
  const addTag = (
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    tags: string[],
    setTags: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setInput('');
  };

  // 태그 삭제
  const removeTag = (
    value: string,
    setTags: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setTags((prev) => prev.filter((t) => t !== value));
  };

  // 저장
  const handleSave = async () => {
    if (!nickname.trim()) {
      showToast('닉네임을 입력해주세요.');
      return;
    }
    if (photoUrls.length < 3) {
      showToast('사진을 최소 3장 업로드해주세요.');
      return;
    }
    if (height !== '' && (Number(height) < 140 || Number(height) > 220)) {
      showToast('키는 140cm ~ 220cm 범위로 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const request: UpdateProfileRequest = {
        nickname: nickname.trim(),
        location: location || undefined,
        height: height ? Number(height) : undefined,
        bodyType: bodyType || undefined,
        religion: religion || undefined,
        smoking: (smoking && smoking.trim() ? (SMOKING_TO_ENUM[smoking] ?? undefined) : undefined) as any,
        drinking: drinking || undefined,
        school: school || undefined,
        occupation: occupation || undefined,
        bio: bio || undefined,
        personalities: personalities.length > 0 ? personalities : undefined,
        hobbies: hobbies.length > 0 ? hobbies : undefined,
        iHave: iHave.length > 0 ? iHave : undefined,
        iWant: iWant.length > 0 ? iWant : undefined,
        photos: photoUrls,
      };

      await profileApi.updateMyProfile(request);
      updateUser({ nickname: nickname.trim() });
      showToast('프로필이 저장되었습니다.');
      router.push('/profile');
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // 로딩
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-gold/20 dark:border-dark-gold/20 border-t-gold dark:border-t-dark-gold rounded-full animate-spin" />
        <p className="mt-4 text-sm text-subtext dark:text-[var(--subtext)]">프로필을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-24">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-subtext dark:text-[var(--subtext)]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text dark:text-dark-cream">프로필 수정</h1>
        <div className="w-6" />
      </div>

      {/* === 사진 관리 === */}
      <Section title="사진 (최소 3장)">
        <div className="grid grid-cols-3 gap-2">
          {photoUrls.map((url, index) => (
            <div key={`${url}-${index}`} className="relative aspect-square rounded-xl overflow-hidden bg-ivory dark:bg-dark-bg border border-[var(--border)]">
              <img src={url} alt={`사진 ${index + 1}`} className="w-full h-full object-cover" />
              {/* 순서 변경 버튼 */}
              {index > 0 && (
                <button
                  onClick={() => movePhotoUp(index)}
                  className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}
              {/* 삭제 버튼 */}
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* 대표 사진 표시 */}
              {index === 0 && (
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] font-bold bg-gold dark:bg-dark-gold text-white rounded-full">
                  대표
                </span>
              )}
            </div>
          ))}
          {/* 사진 추가 버튼 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-gold/30 dark:border-dark-gold/30 flex flex-col items-center justify-center gap-1 hover:border-gold dark:hover:border-dark-gold transition-colors"
          >
            <svg className="w-6 h-6 text-gold dark:text-dark-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="text-[10px] text-gold dark:text-dark-gold">추가</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </Section>

      {/* === 기본 정보 === */}
      <Section title="기본 정보">
        <InputField label="닉네임" value={nickname} onChange={setNickname} placeholder="닉네임 입력" />
        <div className="mb-5">
          <label className="block text-sm font-medium text-text dark:text-dark-cream mb-2">출생연도</label>
          <div className="min-h-12 rounded-xl border border-[var(--border)] bg-ivory dark:bg-dark-bg px-4 py-3 text-text dark:text-dark-cream">
            {birthYear || '미등록'}
          </div>
          <p className="mt-2 text-xs leading-5 text-subtext dark:text-[var(--subtext)]">가입 후에는 직접 변경할 수 없습니다. 정정이 필요하면 고객센터로 문의해 주세요.</p>
        </div>
        <SelectField label="지역" value={location} onChange={setLocation} options={LOCATIONS} placeholder="지역 선택" />
        <InputField
          label="키 (cm)"
          value={height}
          onChange={(v) => setHeight(v === '' ? '' : Number(v))}
          placeholder="예: 175"
          type="number"
          min={140}
          max={220}
        />
        <SelectField label="체형" value={bodyType} onChange={setBodyType} options={bodyTypeOptions} placeholder="체형 선택" />
        <SelectField label="종교" value={religion} onChange={setReligion} options={RELIGIONS} placeholder="종교 선택" />
        <SelectField label="흡연" value={smoking} onChange={setSmoking} options={SMOKING_OPTIONS} placeholder="흡연 여부" />
        <SelectField label="음주" value={drinking} onChange={setDrinking} options={DRINKING_OPTIONS} placeholder="음주 여부" />
      </Section>

      {/* === 직업/학력 === */}
      <Section title="직업/학력">
        <InputField label="소속/학교" value={school} onChange={setSchool} placeholder="학교 또는 소속 입력" />
        <InputField label="직업" value={occupation} onChange={setOccupation} placeholder="직업 입력" />
      </Section>

      {/* === 자기소개 === */}
      <Section title="자기소개">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="자신을 자유롭게 소개해주세요..."
          maxLength={500}
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-ivory dark:bg-dark-bg border border-[var(--border)] focus:border-gold dark:focus:border-dark-gold focus:outline-none text-sm text-text dark:text-dark-cream placeholder-subtext/40 dark:placeholder-[var(--subtext)]/40 resize-none transition-colors"
        />
        <p className="text-right text-xs text-subtext dark:text-[var(--subtext)] mt-1">{bio.length}/500</p>
      </Section>

      {/* === 성격 (multi-select chips) === */}
      <Section title="성격">
        <div className="flex flex-wrap gap-2">
          {PERSONALITY_OPTIONS.map((option) => (
            <ChipButton
              key={option}
              label={option}
              selected={personalities.includes(option)}
              onClick={() => toggleChip(option, personalities, setPersonalities)}
            />
          ))}
        </div>
      </Section>

      {/* === 취미 (multi-select chips) === */}
      <Section title="취미">
        <div className="flex flex-wrap gap-2">
          {HOBBY_OPTIONS.map((option) => (
            <ChipButton
              key={option}
              label={option}
              selected={hobbies.includes(option)}
              onClick={() => toggleChip(option, hobbies, setHobbies)}
            />
          ))}
        </div>
      </Section>

      {/* === I Have (자유 입력 태그) === */}
      <Section title="I Have">
        <TagInput
          tags={iHave}
          input={iHaveInput}
          setInput={setIHaveInput}
          onAdd={() => addTag(iHaveInput, setIHaveInput, iHave, setIHave)}
          onRemove={(tag) => removeTag(tag, setIHave)}
          placeholder="보유한 것을 입력 (예: 자차, 반려견)"
        />
      </Section>

      {/* === I Want (자유 입력 태그) === */}
      <Section title="I Want">
        <TagInput
          tags={iWant}
          input={iWantInput}
          setInput={setIWantInput}
          onAdd={() => addTag(iWantInput, setIWantInput, iWant, setIWant)}
          onRemove={(tag) => removeTag(tag, setIWant)}
          placeholder="원하는 것을 입력 (예: 같이 여행, 주말 데이트)"
        />
      </Section>

      {/* 하단 저장 버튼 (고정, BottomTabBar 위) */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white dark:bg-dark-card border-t border-[var(--border)] z-[55]">
        <div className="max-w-screen-md mx-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-rosegold dark:from-dark-gold dark:to-rosegold text-white font-bold text-base shadow-lg shadow-gold/20 dark:shadow-dark-gold/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

// === 재사용 컴포넌트 ===

/** 섹션 래퍼 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-bold text-text dark:text-dark-cream mb-3 px-1">{title}</h2>
      {children}
    </div>
  );
}

/** 텍스트/숫자 입력 필드 */
function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  max,
}: {
  label: string;
  value: string | number | '';
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-subtext dark:text-[var(--subtext)] mb-1 px-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full px-4 py-3 rounded-xl bg-ivory dark:bg-dark-bg border border-[var(--border)] focus:border-gold dark:focus:border-dark-gold focus:outline-none text-sm text-text dark:text-dark-cream placeholder-subtext/40 dark:placeholder-[var(--subtext)]/40 transition-colors"
      />
    </div>
  );
}

/** 셀렉트 필드 */
function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-subtext dark:text-[var(--subtext)] mb-1 px-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-ivory dark:bg-dark-bg border border-[var(--border)] focus:border-gold dark:focus:border-dark-gold focus:outline-none text-sm text-text dark:text-dark-cream transition-colors appearance-none"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

/** 칩 버튼 (multi-select) */
function ChipButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3.5 py-2 rounded-full text-sm font-medium transition-all
        ${selected
          ? 'bg-gold dark:bg-dark-gold text-white shadow-sm'
          : 'bg-ivory dark:bg-dark-bg text-subtext dark:text-[var(--subtext)] border border-[var(--border)] hover:border-gold/40 dark:hover:border-dark-gold/40'
        }
      `}
    >
      {label}
    </button>
  );
}

/** 태그 입력 컴포넌트 */
function TagInput({
  tags,
  input,
  setInput,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  input: string;
  setInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (tag: string) => void;
  placeholder: string;
}) {
  // Enter 키로 태그 추가
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <div>
      {/* 태그 목록 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gold/10 dark:bg-dark-gold/10 text-sm text-gold dark:text-dark-gold"
            >
              {tag}
              <button onClick={() => onRemove(tag)} className="ml-0.5 hover:text-red-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
      {/* 입력 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 rounded-xl bg-ivory dark:bg-dark-bg border border-[var(--border)] focus:border-gold dark:focus:border-dark-gold focus:outline-none text-sm text-text dark:text-dark-cream placeholder-subtext/40 dark:placeholder-[var(--subtext)]/40 transition-colors"
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-4 py-3 rounded-xl bg-gold dark:bg-dark-gold text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          추가
        </button>
      </div>
    </div>
  );
}
