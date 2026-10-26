'use client';

import { useUIStore } from '@/store/uiStore';
import styles from './Toast.module.css';

export default function Toast() {
  const message = useUIStore((state) => state.toastMessage);

  if (!message) return null;

  return (
    <div className={styles.toast} role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
