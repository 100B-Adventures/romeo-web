/**
 * 회귀 고정: 교차 코드리뷰 BLOCK B3 (2026-08-30).
 *
 * 웹에는 `/auth/login/start` 서버 분기가 아예 없었다. 처음 오신 분에게도 옛 가입 문자
 * 인증을 그대로 태웠고, 그 길은 통신사 성인 본인확인을 거치지 않는다(결정 33 우회).
 */
import { webLoginBranch, WEB_IDV_UNAVAILABLE_MESSAGE } from '../authFlow';
import type { LoginStartResponse } from '../api/auth';

function response(over: Partial<LoginStartResponse>): LoginStartResponse {
  return {
    accountState: 'NEW',
    nextStep: 'IDV',
    idvSession: null,
    smsChallenge: null,
    block: null,
    adultDeclarationRequired: false,
    ...over,
  };
}

describe('웹 로그인 분기', () => {
  it('기존 회원은 문자 6자리로 간다', () => {
    expect(webLoginBranch(response({ accountState: 'EXISTING', nextStep: 'SMS_CODE' })))
      .toEqual({ kind: 'sms', adultDeclarationRequired: false });
  });

  it('신규 회원은 문자 가입과 자기신고 화면으로 간다', () => {
    expect(webLoginBranch(response({
      accountState: 'NEW',
      nextStep: 'SMS_CODE',
      adultDeclarationRequired: true,
    }))).toEqual({ kind: 'signup' });
  });

  it('성인 근거가 없는 기존 회원은 문자 뒤 1회 자기신고가 필요하다', () => {
    expect(webLoginBranch(response({
      accountState: 'IDV_INCOMPLETE',
      nextStep: 'SMS_CODE',
      adultDeclarationRequired: true,
    }))).toEqual({ kind: 'sms', adultDeclarationRequired: true });
  });

  it('처음 오신 분은 문자 가입으로 새지 않는다', () => {
    const branch = webLoginBranch(response({
      accountState: 'NEW',
      nextStep: 'IDV',
      idvSession: { idvSessionId: 'idv-1', expiresAt: '2026-09-01T12:00:00+09:00', carriers: ['SKT', 'KT', 'LGU', 'MVNO'] },
    }));
    expect(branch).toEqual({ kind: 'idv', sessionId: 'idv-1' });
  });

  it('가입 도중 이탈하신 분도 문자 가입으로 새지 않는다', () => {
    expect(webLoginBranch(response({
      accountState: 'IDV_INCOMPLETE',
      nextStep: 'IDV',
      idvSession: { idvSessionId: 'idv-2', expiresAt: '2026-09-01T12:00:00+09:00', carriers: ['SKT'] },
    })).kind).toBe('idv');
  });

  it('만 19세 미만은 서버가 준 문구로 끊는다', () => {
    const branch = webLoginBranch(
      response({ accountState: 'BLOCKED_UNDERAGE', nextStep: 'BLOCKED', block: { message: '만 19세가 되는 날부터 가입하실 수 있어요.' } }),
    );
    expect(branch).toEqual({ kind: 'blocked', message: '만 19세가 되는 날부터 가입하실 수 있어요.', adultAt: null });
  });

  it('본인확인 세션 ID가 빠진 비정상 응답은 기존 앱 안내 폴백을 유지한다', () => {
    expect(webLoginBranch(response({ accountState: 'NEW', nextStep: 'IDV', idvSession: null }))).toEqual({ kind: 'idv-unavailable' });
  });

  it('성인 도달일 당일 서버가 IDV로 열면 웹은 과거 차단 날짜를 재해석하지 않는다', () => {
    const branch = webLoginBranch(response({
      accountState: 'NEW',
      nextStep: 'IDV',
      idvSession: { idvSessionId: 'adult-today', expiresAt: '2026-09-01T12:00:00+09:00', carriers: ['SKT'] },
      block: { message: '만 19세가 되는 2026년 9월 1일부터 가입하실 수 있어요.', adultAt: '2026-09-01' },
    }));
    expect(branch).toEqual({ kind: 'idv', sessionId: 'adult-today' });
  });

  it('비정상 nextStep은 문자 로그인으로 fail-open 하지 않는다', () => {
    expect(webLoginBranch(response({ nextStep: 'BROKEN' as LoginStartResponse['nextStep'] }))).toEqual({ kind: 'idv-unavailable' });
    expect(WEB_IDV_UNAVAILABLE_MESSAGE).toContain('본인확인 세션');
  });
});
