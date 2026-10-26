import type { TodayRecommendationResponse } from './api/matching';

export type HomeEmptyNoticeIcon = 'shield' | 'clock' | 'diamond' | 'check';

export interface HomeEmptyCopy {
  kicker: "TODAY'S ONE";
  title: string;
  headline: { firstLine: string; prefix: string; emphasis: string; suffix: string };
  noticeIcon: HomeEmptyNoticeIcon;
  noticeTitle: string;
  description: string;
  timeLabel: string;
  editorNote: string;
  action?: { label: string; route: '/profile/verification' };
}

const copy = (value: Omit<HomeEmptyCopy, 'kicker'>): HomeEmptyCopy => ({ kicker: "TODAY'S ONE", ...value });

const FILTERED_OUT_COPY = copy({
  title: '지금 기준을 모두 통과한 분이 없습니다',
  headline: { firstLine: '오늘은 기준에 맞는', prefix: '', emphasis: '한 분', suffix: '을 기다려요' },
  noticeIcon: 'diamond',
  noticeTitle: '오늘은 기준을 모두 통과한 분이 없습니다.',
  description: '기준을 낮추거나 지역을 임의로 넓히지 않고, 맞는 분을 계속 찾고 있어요.',
  timeLabel: 'NEXT · 내일 정오',
  editorNote: '오늘은 회원님의 기준에 확신이 서는 분을 찾지 못했습니다. 어중간한 한 분을 채우는 대신 빈 지면을 택했어요. 기준을 낮추지 않는 것, 그것이 매일 단 한 분만 싣는 약속입니다.',
});

const DECIDED_TODAY_COPY = copy({
  title: '오늘은 마무리됐어요',
  headline: { firstLine: '오늘의 선택은', prefix: '', emphasis: '마무리', suffix: '됐어요' },
  noticeIcon: 'check',
  noticeTitle: '오늘의 응답을 모두 마쳤습니다.',
  description: '선택한 기록은 히스토리에 남아 있어요. 다음 한 분은 내일 정오에 도착합니다.',
  timeLabel: 'NEXT · 내일 정오',
  editorNote: '한 사람을 충분히 읽고 결정하는 일이 빠르게 넘기는 것보다 중요해요. 오늘의 선택은 안전하게 보관하고, 내일 정오에 새로운 한 분을 보내드릴게요.',
});

const EMPTY_REASON_COPY = {
  MALE_REVIEW_PENDING: copy({
    title: '심사 완료 후 추천이 시작돼요',
    headline: { firstLine: '심사 완료 후', prefix: '', emphasis: '소개', suffix: '가 시작돼요' },
    noticeIcon: 'shield',
    noticeTitle: '제출한 인증을 큐피드가 확인하고 있습니다.',
    description: '심사가 끝나면 다음 정오부터 매일 한 분을 보내드려요. 심사 중에는 새 서류를 다시 제출하지 않아도 됩니다.',
    timeLabel: '심사 완료 후 시작',
    editorNote: '서류를 직접 확인하는 시간은 상대가 안심하고 한 사람을 읽기 위한 과정이에요. 확인이 끝나면 다음 정오부터 매일 한 분을 보내드립니다.',
  }),
  MALE_VERIFICATION_REQUIRED: copy({
    title: '인증 1건이면 소개가 시작돼요',
    headline: { firstLine: '인증 1건이면', prefix: '', emphasis: '소개', suffix: '가 시작돼요' },
    noticeIcon: 'shield',
    noticeTitle: '인증 1건 완료 후 소개가 시작됩니다.',
    description: '학력·직장·자산·소득 중 하나만 인증하면 다음 정오부터 오늘의 한 분을 받아요. 서류는 심사 후 7일 내 파기됩니다.',
    timeLabel: '인증 완료 후 시작',
    editorNote: '서류를 먼저 확인하는 이유는 하나예요. 상대가 안심하고 한 사람을 읽을 수 있어야, 그 소개가 진짜 만남이 되니까요. 확인이 끝나면 다음 정오부터 매일 한 분을 보내드립니다.',
    action: { label: '인증하러 가기', route: '/profile/verification' },
  }),
  SLOT_NOT_GENERATED: copy({
    title: '내일 정오 다음 추천이 도착해요',
    headline: { firstLine: '다음 지면은', prefix: '', emphasis: '내일 정오', suffix: '에 열려요' },
    noticeIcon: 'clock',
    noticeTitle: '다음 추천은 내일 정오에 도착합니다.',
    description: '오늘 정오 슬롯이 생성된 뒤 가입했다면 다음 회차부터 참여해요. 하루 한 번, 정오에 고른 한 분만 보내드립니다.',
    timeLabel: 'NEXT PICK · 내일 정오',
    editorNote: '큐피드는 하루 한 번 같은 시간에 한 사람만 골라요. 오늘의 지면을 급히 채우지 않고, 내일 정오 다음 소개부터 회원님의 기준을 온전히 반영하겠습니다.',
  }),
  FILTERED_OUT: FILTERED_OUT_COPY,
  DECIDED_TODAY: DECIDED_TODAY_COPY,
} satisfies Record<NonNullable<TodayRecommendationResponse['emptyReason']>, HomeEmptyCopy>;

export function getHomeEmptyCopy(recommendation: TodayRecommendationResponse): HomeEmptyCopy {
  const reason = recommendation.emptyReason;
  const reasonCopy = reason && Object.hasOwn(EMPTY_REASON_COPY, reason)
    ? EMPTY_REASON_COPY[reason as keyof typeof EMPTY_REASON_COPY]
    : undefined;
  if (reasonCopy) return reasonCopy;

  const slots = recommendation.slots || [];
  if (recommendation.hasActiveMatching) {
    return copy({
      title: '이미 이어진 인연이 있어요',
      headline: { firstLine: '이어진 인연은', prefix: '', emphasis: '히스토리', suffix: '에서 계속돼요' },
      noticeIcon: 'check',
      noticeTitle: '이미 이어진 인연이 있습니다.',
      description: '새 추천 대신 히스토리에서 진행 중인 인연을 확인해 주세요.',
      timeLabel: 'NEXT · 내일 정오',
      editorNote: '서로의 선택이 이어진 동안에도 소개 일정은 멈추지 않아요. 진행 중인 인연은 히스토리에서 확인하고, 새 지면은 내일 정오에 받아보세요.',
    });
  }
  const completedToday = slots.some((slot) => slot.status === 'RESPONDED'
    || (slot.profiles || []).some((profile) => profile.alreadyLiked));
  if (completedToday) return DECIDED_TODAY_COPY;
  if (recommendation.nextSlotTime || slots.some((slot) => slot.upcoming) || (recommendation.pendingCount ?? 0) > 0) {
    return copy({
      title: '다음 한 분은 정오에 도착해요',
      headline: { firstLine: '다음 한 분은', prefix: '', emphasis: '정오', suffix: '에 도착해요' },
      noticeIcon: 'clock',
      noticeTitle: '다음 추천을 정오에 준비하고 있습니다.',
      description: '하루 한 분만 신중히 골라 매일 정오에 보여드립니다.',
      timeLabel: 'NEXT · 정오',
      editorNote: '빠르게 많은 사람을 넘기는 대신, 큐피드는 하루 한 사람을 읽을 수 있게 편집해요. 다음 지면이 열릴 때까지 기준을 그대로 지키겠습니다.',
    });
  }
  if ((recommendation.expiredCount ?? 0) > 0) {
    return copy({
      title: '오늘의 추천 시간이 지났어요',
      headline: { firstLine: '오늘의 지면은', prefix: '', emphasis: '마감', suffix: '됐어요' },
      noticeIcon: 'clock',
      noticeTitle: '오늘의 추천 열람 시간이 끝났습니다.',
      description: '놓친 추천은 히스토리에서 확인하고, 내일 정오에 다음 한 분을 만나보세요.',
      timeLabel: 'NEXT · 내일 정오',
      editorNote: '하루 한 사람을 충분히 읽을 시간을 지키기 위해 오늘의 지면은 여기서 닫아요. 지나간 기록은 보존하고, 내일 정오 새 지면을 준비하겠습니다.',
    });
  }
  return FILTERED_OUT_COPY;
}
