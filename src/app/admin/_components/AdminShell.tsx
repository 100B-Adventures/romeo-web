'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../admin-theme.module.css';

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/review', label: '인증 심사' },
  { href: '/admin/reports', label: '신고 관리' },
  { href: '/admin/users', label: '회원 관리' },
  { href: '/admin/hearts', label: '하트 관리' },
  { href: '/admin/bulk-likes', label: '대량 좋아요' },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="관리자 메뉴">
        <div className={styles.brand}>
          Cupid <strong className={styles.brandAccent}>Admin</strong>
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActive(pathname, item.href) ? styles.navLinkActive : ''}`}
              aria-current={isActive(pathname, item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
