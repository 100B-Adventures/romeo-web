import { fireEvent, render, screen } from '@testing-library/react';
import BottomTabBar from '../BottomTabBar';
import { useUIStore } from '@/store/uiStore';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('QA-GATE-LAYOUT-01 하단 탭바 외곽 높이 계약', () => {
  beforeEach(() => {
    push.mockClear();
    useUIStore.setState({ activeTab: 'home' });
  });

  it('QA-GATE-LAYOUT-01-UNIT-01 정상 경로: 52px 토큰과 높이에 불참하는 상단 테두리를 함께 쓴다', () => {
    render(<BottomTabBar />);

    const nav = screen.getByTestId('bottom-tab-bar');
    const content = screen.getByTestId('bottom-tab-bar-content');
    const border = screen.getByTestId('bottom-tab-bar-border');
    expect(nav).not.toHaveClass('border-t');
    expect(content).toHaveClass('h-bottom-tab-bar');
    expect(content).not.toHaveClass('border-t');
    expect(border).toHaveClass('absolute', 'border-t');
  });

  it('QA-GATE-LAYOUT-01-UNIT-02 거절 조건: 흐름 안 상자에 높이를 늘리는 테두리를 다시 두지 않는다', () => {
    render(<BottomTabBar />);

    expect(screen.getByTestId('bottom-tab-bar').className.split(/\s+/))
      .not.toEqual(expect.arrayContaining(['border-t']));
    expect(screen.getByTestId('bottom-tab-bar-content').className.split(/\s+/))
      .not.toEqual(expect.arrayContaining(['border-t']));
  });

  it('QA-GATE-LAYOUT-02-UNIT-01 기존 기능: 탭 클릭은 대응 경로로 이동한다', () => {
    render(<BottomTabBar />);

    fireEvent.click(screen.getByRole('button', { name: '히스토리' }));

    expect(push).toHaveBeenCalledWith('/history');
  });
});
