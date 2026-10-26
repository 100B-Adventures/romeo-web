'use client';

import type { HeartInsufficientDetails } from '@/lib/utils/errorHandler';
import styles from './HeartInsufficientDialog.module.css';

interface HeartInsufficientDialogProps {
  details: HeartInsufficientDetails | null;
  onClose: () => void;
  onCharge: () => void;
}

export default function HeartInsufficientDialog({ details, onClose, onCharge }: HeartInsufficientDialogProps) {
  if (!details) return null;

  return (
    <div className={styles.veil} role="presentation">
      <section
        className={styles.sheet}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="heart-insufficient-title"
        aria-describedby="heart-insufficient-message"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
      >
        <p className={styles.kicker}>HEARTS · 하트</p>
        <h2 className={styles.title} id="heart-insufficient-title">하트가 부족해요</h2>
        <div className={styles.ledger} id="heart-insufficient-message">
          <p><span>남은 하트</span><strong>{details.balance}</strong></p>
          <p><span>필요한 하트</span><strong>{details.required}</strong></p>
        </div>
        <p className={styles.body}>{details.message}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>취소</button>
          <button type="button" className={styles.primary} autoFocus onClick={onCharge}>하트 충전하러 가기</button>
        </div>
      </section>
    </div>
  );
}
