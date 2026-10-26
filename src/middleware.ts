import { NextResponse, type NextRequest } from 'next/server';

// v39.5에서 커뮤니티가 하단 탭으로 복원됐다. live·meeting만 폐기 페이지로 유지한다.
// (app) layout이 'use client'라 redirect()가 spinner 렌더 후 동작 → 미들웨어로 우선 차단
const RETIRED_PATHS = [
  /^\/live$/,
  /^\/meeting$/,
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (RETIRED_PATHS.some((re) => re.test(pathname))) {
    const url = req.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/live', '/meeting'],
};
