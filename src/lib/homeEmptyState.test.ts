import { getHomeEmptyCopy } from './homeEmptyState';
import type { TodayRecommendationResponse } from './api/matching';

const response = (patch: Partial<TodayRecommendationResponse> = {}): TodayRecommendationResponse => ({
  currentSlot: '12', nextSlot: null, nextSlotTime: null, hasActiveMatching: false,
  slots: [], expiredCount: 0, pendingCount: 0, adultDeclarationRequired: false, ...patch,
});

describe('N-4 웹 추천 빈 상태 사유 계약', () => {
  it('N-4-WEB-01 구 18시 슬롯 값이 남아 있어도 제품 정본인 정오만 안내한다', () => {
    const copy = getHomeEmptyCopy(response({ nextSlotTime: '18:00' }));
    expect(copy.description).toContain('정오');
    expect(copy.description).not.toContain('18:00');
  });

  it('N-4-WEB-02 alreadyLiked 프로필은 오늘 결정 완료로 안내한다', () => {
    const liked = { alreadyLiked: true } as never;
    const copy = getHomeEmptyCopy(response({
      slots: [{ slotId: 1, slot: '12', slotLabel: '정오', status: null, profiles: [liked], profileCount: 1, expiresAt: null, remainingSeconds: null, active: false, upcoming: false }],
    }));
    expect(copy.title).toBe('오늘은 마무리됐어요');
  });

  it('N-4-WEB-03 slots가 없고 근거 없는 상태에서 세부 탈락 사유를 지어내지 않는다', () => {
    const copy = getHomeEmptyCopy(response({ slots: undefined as never }));
    expect(copy.title).toContain('기준을 모두 통과한 분이 없습니다');
    expect(copy.description).not.toMatch(/심사|외모|소득/);
  });

  it.each([
    ['MALE_REVIEW_PENDING', '심사 완료 후 추천이 시작돼요', '심사가 끝나면 다음 정오'],
    ['MALE_VERIFICATION_REQUIRED', '인증 1건이면 소개가 시작돼요', '다음 정오부터 오늘의 한 분'],
    ['SLOT_NOT_GENERATED', '내일 정오 다음 추천이 도착해요', '다음 회차부터 참여'],
    ['FILTERED_OUT', '지금 기준을 모두 통과한 분이 없습니다', '기준을 낮추거나'],
    ['DECIDED_TODAY', '오늘은 마무리됐어요', '다음 한 분은 내일 정오'],
  ] as const)('EMPTY-REASON-WEB-%s 서버 사유를 기존 추론보다 우선한다', (emptyReason, title, description) => {
    const copy = getHomeEmptyCopy(response({
      emptyReason,
      hasActiveMatching: true,
      nextSlotTime: '18:00',
    }));

    expect(copy.title).toBe(title);
    expect(copy.description).toContain(description);
    expect(copy.kicker).toBe("TODAY'S ONE");
    expect(copy.editorNote).not.toHaveLength(0);
  });

  it('EMPTY-REASON-WEB-REQUIRED 인증 미제출·반려 사유는 인증 제출 화면 CTA를 제공한다', () => {
    expect(getHomeEmptyCopy(response({ emptyReason: 'MALE_VERIFICATION_REQUIRED' })).action).toEqual({
      label: '인증하러 가기',
      route: '/profile/verification',
    });
  });

  it('EMPTY-REASON-WEB-NO-CTA 인증 필요 외 사유는 임의 CTA를 노출하지 않는다', () => {
    for (const emptyReason of ['MALE_REVIEW_PENDING', 'SLOT_NOT_GENERATED', 'FILTERED_OUT', 'DECIDED_TODAY'] as const) {
      expect(getHomeEmptyCopy(response({ emptyReason })).action).toBeUndefined();
    }
  });

  it('EMPTY-REASON-WEB-LEGACY 구서버처럼 emptyReason이 없으면 기존 분기를 유지한다', () => {
    expect(getHomeEmptyCopy(response({ hasActiveMatching: true }))).toMatchObject({
      title: '이미 이어진 인연이 있어요',
      description: '새 추천 대신 히스토리에서 진행 중인 인연을 확인해 주세요.',
    });
  });

  it('EMPTY-REASON-WEB-FUTURE 알 수 없는 서버 사유는 크래시 없이 기존 분기로 폴백한다', () => {
    expect(getHomeEmptyCopy(response({
      emptyReason: 'FUTURE_REASON' as never,
      hasActiveMatching: true,
    }))).toMatchObject({
      title: '이미 이어진 인연이 있어요',
      description: '새 추천 대신 히스토리에서 진행 중인 인연을 확인해 주세요.',
    });
  });

  it('EMPTY-REASON-WEB-PROTOTYPE 프로토타입 상속 키는 서버 사유로 인정하지 않고 기존 분기로 폴백한다', () => {
    expect(getHomeEmptyCopy(response({
      emptyReason: '__proto__' as never,
      hasActiveMatching: true,
    }))).toMatchObject({
      title: '이미 이어진 인연이 있어요',
      description: '새 추천 대신 히스토리에서 진행 중인 인연을 확인해 주세요.',
    });
  });
});
