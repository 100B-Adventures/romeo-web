'use client';

import styles from './StatusBar.module.css';

/**
 * Romeo vNext 매거진 지면의 정본 상태바.
 * 승인 시안 v39의 25px 상태바 규격을 공통 셸에서 소유해 홈·상세의
 * 첫 viewport 좌표가 화면마다 달라지지 않도록 한다.
 */
export default function StatusBar() {
  return (
    <div className={styles.statusBar} data-testid="app-status-bar">
      <span>12:00</span>
      <span>정오</span>
    </div>
  );
}
