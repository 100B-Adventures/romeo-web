import { AxiosError } from 'axios';

export interface ErrorResponse {
  code: string;
  message: string;
  timestamp: string;
  path: string;
}

export interface HeartInsufficientDetails {
  balance: number;
  required: number;
  message: string;
}

const HEART_BALANCE_PATTERN = /현재\s*잔액\s*:\s*(\d+)\s*,\s*필요\s*금액\s*:\s*(\d+)/;

export const getHeartInsufficientDetails = (error: any): HeartInsufficientDetails | null => {
  const errorResponse: ErrorResponse | undefined = error?.response?.data;
  if (errorResponse?.code !== 'PAYMENT_006') return null;

  const match = errorResponse.message?.match(HEART_BALANCE_PATTERN);
  const balance = Number(match?.[1] ?? 0);
  const required = Number(match?.[2] ?? 0);

  return {
    balance,
    required,
    message: `지금 하트가 ${balance}개예요. ${required}개가 필요해요.`,
  };
};

/**
 * API 에러 객체에서 사용자에게 보여줄 메시지를 추출합니다.
 * 백엔드에서 에러 코드만 제공하고, 프론트엔드에서 사용자 친화적 메시지로 변환합니다.
 */
export const getErrorMessage = (error: any): string => {
  // 응답 인터셉터가 `{...error, errorResponse}` 로 다시 던진다. 에러 객체를 펼치면
  // `response` 가 딸려오지 않아 status 도 data 도 사라진다. 그래서 두 자리를 함께 본다.
  // (2026-09-09 앱 실기 QA 에서 홈 화면에 서버 문구 "인증이 필요합니다" 가 그대로 뜬 것과 같은 원인)
  const errorResponse: ErrorResponse | undefined = error?.errorResponse ?? error?.response?.data;

  const authMessage = errorResponse?.message;
  if (
    error?.response?.status === 401 ||
    error?.status === 401 ||
    authMessage === '인증이 필요합니다' ||
    authMessage === 'Login required'
  ) {
    return '로그인이 만료되었습니다. 다시 로그인해주세요.';
  }

  if (errorResponse?.code) {
    // 에러 코드 기반으로 사용자 친화적 메시지 제공
    switch (errorResponse.code) {
      case 'COMMON_001':
        return '입력값이 올바르지 않습니다. 다시 확인해주세요.';
      case 'COMMON_002':
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      case 'COMMON_003':
        return '데이터베이스 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      case 'AUTH_001':
        return '유효하지 않은 전화번호 형식입니다.';
      case 'AUTH_002':
        return '인증번호가 일치하지 않습니다.';
      case 'AUTH_003':
        return '인증번호가 만료되었습니다. 다시 요청해주세요.';
      case 'AUTH_004':
        return '인증번호 요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.';
      case 'MATCH_004':
        return '이미 마음을 전했어요.';
      // 결제 관련
      case 'PAYMENT_001':
        return '결제 처리에 실패했습니다. 다시 시도해주세요.';
      case 'PAYMENT_002':
        return '이미 처리된 결제입니다.';
      case 'PAYMENT_003':
        return '결제 내역을 찾을 수 없습니다.';
      case 'PAYMENT_004':
        return '환불 처리에 실패했습니다. 고객센터에 문의해주세요.';
      case 'PAYMENT_005':
        return '본인의 결제만 처리할 수 있습니다.';
      case 'PAYMENT_006':
        return getHeartInsufficientDetails(error)?.message || '하트가 부족해요. 충전 후 이용해주세요.';
      default:
        // 백엔드가 제공한 표준 메시지 사용 (ErrorCode의 message)
        return errorResponse.message || '오류가 발생했습니다.';
    }
  }

  // Axios 네트워크 에러
  if (error instanceof AxiosError) {
    if (!error.response) {
      return '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.';
    }
  }

  // 기타 에러
  if (error?.message) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다';
};

export const getErrorCode = (error: any): string | null => {
  return error?.response?.data?.code || null;
};

export const isNetworkError = (error: any): boolean => {
  return error instanceof AxiosError && !error.response && !!error.request;
};

export const isServerError = (error: any): boolean => {
  const status = error?.response?.status;
  return status >= 500 && status < 600;
};
