import { render, screen } from '@testing-library/react';
import TermsPage from '../page';
import PrivacyPage from '../../privacy/page';

// 문자 인증 + 성인 자기신고 출시 정책과 4조합 요금이 약관에서 다시 과거 정책으로 돌아가지 않게 고정한다.
describe('이용약관 — 현행 정책 동기화 (M19)', () => {
  it('만 19세 이상 + 문자 인증 + 자기신고를 고지하고, 대행사 인증 완료로 오인시키지 않는다', () => {
    render(<TermsPage />);
    expect(screen.getAllByText(/만 19세 이상/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/문자\(SMS\) 6자리 인증번호/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/직접 신고/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/본인확인 대행사의 인증 완료를 뜻하지 않습니다/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/통신사 본인확인을 통해/)).not.toBeInTheDocument();
    expect(screen.queryByText(/만 18세/)).not.toBeInTheDocument();
  });

  it('요금을 단일 숫자가 아니라 매칭 전/후 × 성별 4조합으로 서술한다', () => {
    render(<TermsPage />);
    expect(screen.getByText(/매칭 전 · 남성/)).toBeInTheDocument();
    expect(screen.getByText(/매칭 전 · 여성/)).toBeInTheDocument();
    expect(screen.getByText(/매칭 이후 · 남성/)).toBeInTheDocument();
    expect(screen.getByText(/매칭 이후 · 여성/)).toBeInTheDocument();
    // 폐기된 OK 1하트·Super OK 3하트 정의가 남아있지 않아야 한다
    expect(screen.queryByText(/1하트가 소모/)).not.toBeInTheDocument();
    expect(screen.queryByText(/3하트가 소모/)).not.toBeInTheDocument();
  });

  it('AI-AC-WEB-04 정상 경로: OpenAI 국외 처리와 선택적 동의, 규칙 추천 대안을 고지한다', () => {
    const { container } = render(<PrivacyPage />);
    const copy = container.textContent || '';

    expect(copy).toContain('OpenAI, L.L.C.');
    expect(copy).toContain('privacy.openai.com');
    expect(copy).toContain('dsar@openai.com');
    expect(copy).toContain('공통 취미, 생활권, MBTI, 결혼 계획, 자녀 계획, 음주, 흡연');
    expect(copy).toContain('종교는 OpenAI에 전송하지 않습니다');
    expect(copy).toContain('규칙 기반 추천을 계속 이용할 수 있습니다');
    expect(copy).toContain('동의 후 하루 추천 생성 시');
    expect(copy).toContain('시행 예정일: 2026년 10월 14일');
  });

  it('AI-AC-WEB-05 거절 조건: 이용약관은 AI 처리를 모든 회원의 필수 조건으로 쓰지 않는다', () => {
    const { container } = render(<TermsPage />);
    const copy = container.textContent || '';

    expect(copy).toContain('회원이 별도로 동의한 경우에만');
    expect(copy).toContain('동의하지 않거나 철회해도 규칙 기반 추천');
    expect(copy).not.toContain('모든 회원의 프로필은 Cupid AI');
    expect(copy).toContain('본 개정 약관은 2026년 10월 14일부터 시행됩니다');
  });
});
