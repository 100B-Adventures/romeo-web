'use client';

import Script from 'next/script';

// Meta 픽셀 기본 코드 (회장 2026-10-27 "알아서 다 연결하고 진행해", 광고 픽셀 설치 요청 2026-10-27).
// 픽셀 ID 는 공개 값이다. NEXT_PUBLIC_META_PIXEL_ID 로 바꿀 수 있고, 없으면 로미오 운영 픽셀을 쓴다.
// 화면 이동(pushState) PageView 는 fbevents.js 가 스스로 보낸다. 버튼 문구·폼 메타데이터 자동 수집(autoConfig)은 끈다.
const DEFAULT_META_PIXEL_ID = '1272331278425904';
const envId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
const META_PIXEL_ID = envId && /^[0-9]+$/.test(envId) ? envId : DEFAULT_META_PIXEL_ID;

export default function MetaPixel() {
  return (
    <Script id="romeo-meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('set', 'autoConfig', false, '${META_PIXEL_ID}');
        fbq('init', '${META_PIXEL_ID}');
        fbq('track', 'PageView');
      `}
    </Script>
  );
}
