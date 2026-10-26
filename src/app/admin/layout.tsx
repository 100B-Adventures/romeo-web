'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import AdminShell from './_components/AdminShell';
import styles from './admin-theme.module.css';
import { isAdminRole } from './_components/adminAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const isLogin = pathname === '/admin/login';

  useEffect(() => {
    useAuthStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || isLogin) return;
    if (!isLoggedIn) {
      router.replace('/admin/login');
      return;
    }
    if (!isAdminRole(user?.role)) router.replace('/home');
  }, [hydrated, isLoggedIn, isLogin, router, user?.role]);

  if (isLogin) return <>{children}</>;

  if (!hydrated || !isLoggedIn || !isAdminRole(user?.role)) {
    return (
      <div className={styles.adminRoot}>
        <div className={styles.loadingShell}>관리자 권한을 확인하고 있습니다.</div>
      </div>
    );
  }

  return (
    <div className={styles.adminRoot}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
