'use client';

import Script from 'next/script';

// GA4 수집 태그 (회장 2026-06 OUTPUT 집중령 — 각 앱이 gtag 직접 심기)
// 측정 ID 는 공개 값이다. NEXT_PUBLIC_GA_MEASUREMENT_ID 로 바꿀 수 있고, 없으면 로미오 운영 웹 스트림을 쓴다(Clarity·Meta 픽셀과 같은 방식).
const DEFAULT_GA_MEASUREMENT_ID = 'G-KTKDSQKF7K';
const envId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const GA_MEASUREMENT_ID = envId && /^G-[A-Z0-9]+$/.test(envId) ? envId : DEFAULT_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
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
