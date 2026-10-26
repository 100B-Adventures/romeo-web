import type { LoginStartResponse } from './api/auth';

/**
 * 웹의 가입·재로그인 갈림길 (FRD v16 §14.2, 회장 결정 33).
 *
 * 웹에는 이 분기가 아예 없었다. 그래서 처음 오신 분에게도 옛 가입 문자 인증을 태웠고,
 * 대행사 미연동 기간에는 문자 인증 뒤 출생연도와 만 19세 이상 자기신고를 요구한다.
 * (교차 코드리뷰 BLOCK B3).
 *
 * 분기를 화면 안에 인라인으로 두면 검증할 수 없다. 모바일이 같은 이유로
 * `vnextEntryFlow.loginBranchTarget` 을 밖으로 뺐다. 웹도 같은 모양으로 둔다.
 *
 * `nextStep` 외의 조합은 문자 로그인으로 추측하지 않는다. 서버 응답이 깨졌을 때
 * 서버가 선언 필요 상태를 돌려주면 토큰 발급 전 선언 단계로 보존한다.
 */
export type WebLoginBranch =
  | { kind: 'signup' }
  | { kind: 'sms'; adultDeclarationRequired: boolean }
  | { kind: 'idv'; sessionId: string }
  | { kind: 'idv-unavailable' }
  | { kind: 'blocked'; message: string; adultAt: string | null };

export const WEB_IDV_UNAVAILABLE_MESSAGE =
  '본인확인 세션을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요. 문제가 계속되면 고객센터로 문의해 주세요.';

export function webLoginBranch(response: LoginStartResponse): WebLoginBranch {
  if (response.nextStep === 'BLOCKED') {
    return {
      kind: 'blocked',
      message: response.block?.message || '지금은 가입하실 수 없습니다.',
      adultAt: response.block?.adultAt ?? null,
    };
  }
  if (response.nextStep === 'IDV') {
    const sessionId = response.idvSession?.idvSessionId;
    return sessionId ? { kind: 'idv', sessionId } : { kind: 'idv-unavailable' };
  }
  if (response.nextStep === 'SMS_CODE' && response.accountState === 'NEW') return { kind: 'signup' };
  if (response.nextStep === 'SMS_CODE') {
    return { kind: 'sms', adultDeclarationRequired: response.adultDeclarationRequired };
  }
  return { kind: 'idv-unavailable' };
}
