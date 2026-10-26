// 모바일 결제 콜백 — Toss가 successUrl/failUrl로 리다이렉트 시 사용
// React Native WebView의 handleNavigationStateChange가 이 URL을 가로채므로
// 실제 페이지 로드는 발생하지 않음. 만약 WebView 외부(브라우저)에서 열리면 이 페이지 표시.
'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function MobileCallbackContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (status === 'success' && paymentKey) {
      const deepLink = `romeoncupid://payment/success?paymentKey=${paymentKey}&orderId=${orderId}&amount=${amount}`;
      window.location.href = deepLink;
    }
  }, [status, searchParams]);

  return (
    // 항상 다크 카드로 고정 표시(시스템 라이트/다크 무관) — tailwind.config.ts의 'dark.*' 고정 색상 사용(var(--bg) 사용 시 시스템 라이트모드에서 색이 바뀌어 원래 하드코딩 의도가 깨짐)
    <div className="flex flex-col items-center justify-center h-screen font-sans bg-dark-bg text-dark-gold">
      {status === 'success' ? (
        <>
          <div className="text-5xl mb-4">💛</div>
          <h2 className="mb-2" style={{ fontFamily: 'Georgia' }}>결제가 완료되었습니다</h2>
          {/* 이 페이지는 .dark 클래스를 적용하지 않아 --placeholder-text가 :root 값(#999)으로 항상 고정 — 원래 하드코딩과 동일 */}
          <p style={{ color: 'var(--placeholder-text)', fontSize: 14 }}>앱으로 돌아가 하트를 확인하세요.</p>
        </>
      ) : (
        <>
          <div className="text-5xl mb-4">😔</div>
          <h2 className="mb-2" style={{ fontFamily: 'Georgia' }}>결제에 실패했습니다</h2>
          <p style={{ color: 'var(--placeholder-text)', fontSize: 14 }}>앱으로 돌아가 다시 시도해주세요.</p>
        </>
      )}
    </div>
  );
}

export default function MobileCallback() {
  return (
    <Suspense fallback={null}>
      <MobileCallbackContent />
    </Suspense>
  );
}
