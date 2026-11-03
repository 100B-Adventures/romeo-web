'use client';

import Script from 'next/script';

// Microsoft Clarity 세션 녹화·히트맵 (회장 2026-11-03 "미연결된거 다 연결해", 관제 측정 설치 요청 2026-11-03).
// 프로젝트 ID 는 공개 값이다. NEXT_PUBLIC_CLARITY_PROJECT_ID 로 바꿀 수 있고, 없으면 로미오 운영 프로젝트를 쓴다.
const DEFAULT_CLARITY_PROJECT_ID = 'z7rm89vlqv';
const envId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim().toLowerCase();
const CLARITY_PROJECT_ID = envId && /^[a-z0-9]+$/.test(envId) ? envId : DEFAULT_CLARITY_PROJECT_ID;

export default function MicrosoftClarity() {
  return (
    <Script id="romeo-microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
      `}
    </Script>
  );
}
