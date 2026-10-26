'use client';

import Script from 'next/script';

// GA4 수집 태그 (회장 2026-06 OUTPUT 집중령 — 각 앱이 gtag 직접 심기)
// measurement ID는 배포 env(NEXT_PUBLIC_GA_MEASUREMENT_ID)로 주입.
// 미설정 시 아무것도 로드하지 않음 = 로컬/미설정 환경 안전 no-op.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
