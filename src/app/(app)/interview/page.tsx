// R21 Cupid 인터뷰 11문항 web (mobile 쌍 — 사용자 명시 "웹·모바일 쌍 구현")
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';

const REGIONS = ['강남', '서울', '수도권', '그 외'] as const;
const JOBS = ['IB·금융', '컨설팅', '의료', '법률', 'IT·개발', '디자인·미디어', '교육·연구', '제조·엔지니어', '공공·공무원', '사업·자영업', '서비스·기타', '학생·취준'] as const;
const MBTIS = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP', '모름'] as const;
const MARRIAGE_PLANS = ['1년 안', '1-2년', '2-3년', '정해두지 않음'] as const;
const CHILD_PLANS = ['원함', '안 원함', '정해두지 않음'] as const;
const BIO_TONES = [
  { roman: 'I', label: '진지한', description: '정중하고 신뢰감 있는 톤' },
  { roman: 'II', label: '유머러스', description: '가볍고 유쾌한 톤' },
  { roman: 'III', label: '미니멀', description: '짧고 담백한 톤' },
  { roman: 'IV', label: '스토리텔러', description: '장면을 그리는 톤' },
  { roman: 'V', label: '직접 작성', description: '초안 없이 내가 직접' },
] as const;

const STORAGE_KEY = 'r21-interview-answers';
const INTERVIEW_INTRO_STORAGE_KEY = 'romeo:interview-intro:v1';

interface Answers {
  region: string | null;
  job: string | null;
  height: number;
  bodyType: string | null;
  mbti: string | null;
  weekday: string;
  weekend: string;
  marriagePlan: string | null;
  childPlan: string | null;
  friendsDescribe: string;
  idealType: string;
}

const initial: Answers = {
  region: null, job: null, height: 170, bodyType: null, mbti: null,
  weekday: '', weekend: '', marriagePlan: null, childPlan: null,
  friendsDescribe: '', idealType: '',
};

const STEPS = [
  { key: 'region', q: '어디 사세요?', type: 'choice', options: REGIONS },
  { key: 'job', q: '어떤 일 하세요?', type: 'choice', options: JOBS },
  { key: 'height', q: '키는요?', type: 'number' },
  { key: 'bodyType', q: '체형은요?', type: 'choice', options: ['마른', '슬림', '보통', '다부진', '통통', '듬직', '볼륨감', '글래머'] },
  { key: 'mbti', q: 'MBTI는?', type: 'choice', options: MBTIS },
  { key: 'weekday', q: '평일은 보통 어떻게 보내세요?', type: 'essay', helper: '회사·취미·운동·휴식 등 50자 이상' },
  { key: 'weekend', q: '주말엔 뭐 하세요?', type: 'essay', helper: '50자 이상' },
  { key: 'marriagePlan', q: '결혼은 언제쯤 생각하세요?', type: 'choice', options: MARRIAGE_PLANS },
  { key: 'childPlan', q: '자녀 계획은요?', type: 'choice', options: CHILD_PLANS },
  { key: 'friendsDescribe', q: '친구들이 본인을 어떻게 묘사하나요?', type: 'essay', helper: '성격·매력·습관 등 50자 이상' },
  { key: 'idealType', q: '어떤 분과 함께하고 싶으세요?', type: 'essay', helper: '성격·가치관·라이프스타일 등 50자 이상' },
] as const;

export default function InterviewPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initial);
  const [phase, setPhase] = useState<'intro' | 'questions' | 'tone'>('questions');
  const [tone, setTone] = useState(0);

  useEffect(() => {
    const pendingInMemory = useUIStore.getState().consumeInterviewIntroPending();
    let pendingInStorage = false;
    try {
      if (window.sessionStorage.getItem(INTERVIEW_INTRO_STORAGE_KEY) === 'pending') {
        window.sessionStorage.removeItem(INTERVIEW_INTRO_STORAGE_KEY);
        pendingInStorage = true;
      }
    } catch {}

    if (pendingInMemory || pendingInStorage) setPhase('intro');

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAnswers({ ...initial, ...JSON.parse(raw).answers });
    } catch {}
  }, []);

  const cur = STEPS[step];
  const val = (answers as any)[cur.key];
  const isValid = cur.type === 'essay' ? (val as string).length >= 50 : cur.type === 'number' ? val > 0 : val !== null;

  const setVal = (v: any) => {
    const next = { ...answers, [cur.key]: v };
    setAnswers(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: next }));
  };

  const onNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else setPhase('tone');
  };

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  if (phase === 'intro') {
    return (
      <section className="min-h-screen bg-white px-6 py-8 max-w-2xl mx-auto text-center" data-testid="interview-intro">
        <p className="text-xs tracking-widest uppercase text-accent mb-3">From Cupid</p>
        <p className="font-serif text-sm text-gray-500 mb-2">Cupid</p>
        <h1 className="font-serif text-2xl mb-4">이제부터 제가<br /><span className="text-accent">준비</span>하겠습니다</h1>
        <p className="text-sm text-gray-500 mb-6">
          지금부터 서로의 <strong className="text-gray-900">아비투스</strong>를 확인하는 인터뷰예요.<br />
          고른 답은 큐피드가 문장으로 엮어드려요.
        </p>
        <ol className="text-left border-y border-gray-200 divide-y divide-gray-200 mb-6">
          <li className="py-3"><strong>Ⅰ 3분 인터뷰</strong><span className="block text-sm text-gray-500">고르면 큐피드가 문장으로</span></li>
          <li className="py-3"><strong>Ⅱ 자격 인증</strong><span className="block text-sm text-gray-500">학력·직장·소득·자산</span></li>
          <li className="py-3"><strong>Ⅲ 정오의 한 분</strong><span className="block text-sm text-gray-500">넘기지 않고 읽는 소개</span></li>
        </ol>
        <button
          type="button"
          className="w-full py-4 rounded-lg bg-accent text-white font-semibold"
          onClick={() => setPhase('questions')}
        >
          ♥ 지금 시작하고 하트 모으기
        </button>
        <p className="mt-3 text-xs text-gray-500">가입 <strong className="text-accent">하트 30개</strong>가 이미 적립됐어요</p>
      </section>
    );
  }

  if (phase === 'tone') {
    return (
      <div className="min-h-screen bg-white px-6 py-8 max-w-2xl mx-auto" data-testid="bio-tone-screen">
        <div className="flex justify-between mb-8">
          <button type="button" onClick={() => setPhase('questions')} className="text-sm text-gray-500">← 뒤로</button>
          <span className="font-serif text-xs text-gray-500 uppercase tracking-wider">톤 선택</span>
        </div>
        <p className="text-xs uppercase tracking-wider text-accent mb-2">큐피드의 손길 · 톤 선택</p>
        <h1 className="font-serif text-2xl mb-2">어떤 <span className="text-accent">톤으로</span> 쓸까요?</h1>
        <p className="text-sm text-gray-500 mb-6">인터뷰 답은 이미 재료로 들어가 있어요. 톤만 고르면 같은 답이 이렇게 달라져요.</p>
        <div className="grid gap-3">
          {BIO_TONES.map((item, index) => (
            <button
              type="button"
              key={item.roman}
              onClick={() => setTone(index)}
              className={`p-4 border rounded-lg text-left ${tone === index ? 'border-accent bg-accent/5' : 'border-gray-200 bg-gray-50'}`}
              data-testid={`bio-tone-${item.roman}`}
            >
              <span className="font-serif text-sm text-accent mr-3">{item.roman}</span>
              <strong>{item.label}</strong>
              <span className="block text-sm text-gray-500 mt-1">{item.description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8 max-w-2xl mx-auto" data-testid="interview-shell">
      <div className="flex justify-between mb-6">
        <button onClick={() => step > 0 ? setStep(step - 1) : router.back()} className="text-sm text-gray-500" data-testid="interview-back">
          ← 뒤로
        </button>
        <span className="font-serif text-xs text-gray-500 uppercase tracking-wider" data-testid="interview-meta">
          NO. {step + 1} / {STEPS.length}
        </span>
      </div>

      <progress
        className="w-full h-1 accent-accent mb-8"
        max={100}
        value={progress}
        aria-label="인터뷰 진행률"
        data-testid="interview-progress"
      />

      <h1 className="font-serif text-2xl mb-6" data-testid="interview-question">{cur.q}</h1>
      {'helper' in cur && cur.helper && <p className="text-sm text-gray-500 mb-6">{cur.helper}</p>}

      {cur.type === 'choice' && (
        <div className="grid gap-3 mb-8">
          {(cur as any).options.map((opt: string) => (
            <button
              key={opt}
              onClick={() => setVal(opt)}
              className={`p-4 border rounded-lg text-left ${val === opt ? 'border-accent bg-accent/5 text-accent font-semibold' : 'border-gray-200 bg-gray-50'}`}
              data-testid={`interview-${cur.key}-${opt}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {cur.type === 'number' && (
        <div className="flex items-center justify-center gap-4 mb-8 py-8">
          <button onClick={() => setVal(Math.max(150, val - 1))} className="w-14 h-14 rounded-full bg-gray-100 text-2xl text-accent">−</button>
          <input
            type="number"
            value={val}
            onChange={(e) => { const n = parseInt(e.target.value, 10); if (n >= 150 && n <= 195) setVal(n); }}
            className="w-24 text-center text-3xl font-serif text-accent border border-gray-200 rounded p-2"
            data-testid="interview-height"
          />
          <button onClick={() => setVal(Math.min(195, val + 1))} className="w-14 h-14 rounded-full bg-gray-100 text-2xl text-accent">+</button>
        </div>
      )}

      {cur.type === 'essay' && (
        <div className="mb-8">
          <textarea
            value={val as string}
            onChange={(e) => setVal(e.target.value)}
            maxLength={150}
            rows={6}
            className="w-full p-3 border border-gray-200 rounded-lg text-base"
            placeholder="50자 이상 자유롭게"
            data-testid={`interview-${cur.key}-input`}
          />
          <div className={`text-xs text-right mt-1 ${(val as string).length >= 50 ? 'text-accent' : 'text-gray-400'}`}>
            {(val as string).length < 50 ? `${50 - (val as string).length}자 더 ` : '✓ '}
            {(val as string).length} / 150
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!isValid}
        className={`w-full py-4 rounded-lg text-white font-semibold ${isValid ? 'bg-accent' : 'bg-gray-300'}`}
        data-testid="interview-next"
      >
        {step === STEPS.length - 1 ? '완료' : '다음'}
      </button>
    </div>
  );
}
