import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InterviewPage from '../page';
import { useUIStore } from '@/store/uiStore';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: jest.fn(), back: jest.fn() }),
}));

const ESSAY = '평일과 주말의 루틴, 성격과 가치관을 충분히 설명하는 오십 자 이상의 계약 테스트 답변입니다. 서로를 존중합니다.';

async function completeInterview() {
  const user = userEvent.setup();
  render(<InterviewPage />);

  await user.click(screen.getByTestId('interview-region-서울'));
  await user.click(screen.getByTestId('interview-next'));
  await user.click(screen.getByTestId('interview-job-IT·개발'));
  await user.click(screen.getByTestId('interview-next'));
  await user.click(screen.getByTestId('interview-next'));
  await user.click(screen.getByTestId('interview-bodyType-보통'));
  await user.click(screen.getByTestId('interview-next'));
  await user.click(screen.getByTestId('interview-mbti-INTJ'));
  await user.click(screen.getByTestId('interview-next'));

  for (const field of ['weekday', 'weekend'] as const) {
    await user.type(screen.getByTestId(`interview-${field}-input`), ESSAY);
    await user.click(screen.getByTestId('interview-next'));
  }

  await user.click(screen.getByTestId('interview-marriagePlan-1-2년'));
  await user.click(screen.getByTestId('interview-next'));
  await user.click(screen.getByTestId('interview-childPlan-원함'));
  await user.click(screen.getByTestId('interview-next'));

  for (const field of ['friendsDescribe', 'idealType'] as const) {
    await user.type(screen.getByTestId(`interview-${field}-input`), ESSAY);
    await user.click(screen.getByTestId('interview-next'));
  }

  return user;
}

describe('AC-55 가입 인터뷰 전 단계 이동', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    useUIStore.setState({ interviewIntroPending: false });
  });

  it('TC-WEB-INTERVIEW-01 정상: 마지막 문항은 존재하지 않는 URL 대신 승인된 톤 선택 화면을 연다', async () => {
    await completeInterview();

    expect(await screen.findByTestId('bio-tone-screen')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /어떤 톤으로 쓸까요/ })).toBeInTheDocument();
    expect(screen.getAllByTestId(/^bio-tone-(I|II|III|IV|V)$/)).toHaveLength(5);
    expect(push).not.toHaveBeenCalledWith('/interview/generate-bio');
    // 이 검증은 인터뷰 전 문항을 실제로 채워 넣으므로 단독 실행에서도 4초를 쓴다.
    // 기본 제한 5초와 여유가 1초도 안 돼, 전체 스위트를 이어 돌리면 시간만으로 실패한다
    // (2026-09-05 실측: 단독 4,069ms 통과 / 전체 이어 돌리면 Exceeded timeout of 5000 ms).
    // 단언이 틀린 적은 없으므로 시간 예산만 늘린다.
  }, 20000);

  it('TC-WEB-INTERVIEW-02 거절: 마지막 서술이 50자 미만이면 톤 선택으로 넘어가지 않는다', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('r21-interview-answers', JSON.stringify({
      answers: {
        region: '서울', job: 'IT·개발', height: 170, bodyType: '보통', mbti: 'INTJ',
        weekday: ESSAY, weekend: ESSAY, marriagePlan: '1-2년', childPlan: '원함',
        friendsDescribe: ESSAY, idealType: '',
      },
    }));
    render(<InterviewPage />);

    await waitFor(() => expect(screen.getByTestId('interview-next')).toBeEnabled());
    for (let index = 0; index < 10; index += 1) {
      await user.click(screen.getByTestId('interview-next'));
    }
    await user.type(screen.getByTestId('interview-idealType-input'), '짧은 답변');

    expect(screen.getByTestId('interview-next')).toBeDisabled();
    expect(screen.queryByTestId('bio-tone-screen')).not.toBeInTheDocument();
  });

  it('TC-WEB-INTERVIEW-03 정상: 신규 가입은 안내를 한 번 거친 뒤 첫 질문을 연다', async () => {
    window.sessionStorage.setItem('romeo:interview-intro:v1', 'pending');
    const user = userEvent.setup();
    render(<InterviewPage />);

    expect(await screen.findByTestId('interview-intro')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('romeo:interview-intro:v1')).toBeNull();
    expect(screen.queryByTestId('interview-question')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /지금 시작하고 하트 모으기/ }));
    expect(screen.getByTestId('interview-question')).toHaveTextContent('어디 사세요?');
  });

  it('TC-WEB-INTERVIEW-04 거절: 세션 저장소가 차단돼도 가입 직후 안내를 건너뛰지 않는다', async () => {
    useUIStore.getState().markInterviewIntroPending();
    const originalGetItem = Storage.prototype.getItem;
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key) {
      if (key === 'romeo:interview-intro:v1') throw new DOMException('차단됨', 'SecurityError');
      return originalGetItem.call(this, key);
    });

    render(<InterviewPage />);

    expect(await screen.findByTestId('interview-intro')).toBeInTheDocument();
    expect(useUIStore.getState().interviewIntroPending).toBe(false);
    expect(screen.queryByTestId('interview-question')).not.toBeInTheDocument();
    getItem.mockRestore();
  });
});
