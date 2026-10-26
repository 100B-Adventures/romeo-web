'use client';

import { useEffect } from 'react';

/**
 * PWA 서비스워커 등록 — 설치가능(installable) 요건 충족용 최소 등록.
 * 백엔드 API·인증·결제 로직은 건드리지 않는다(public/sw.js 참조).
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // eslint-disable-next-line no-console
        console.log('[PWA] Service Worker 등록 완료:', registration.scope);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('[PWA] Service Worker 등록 실패:', error);
      });
  }, []);

  return null;
}
