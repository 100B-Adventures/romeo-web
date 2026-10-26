'use client';

import type { HomeEmptyCopy, HomeEmptyNoticeIcon } from '@/lib/homeEmptyState';
import styles from './EmptyTodayCard.module.css';

interface Props {
  copy: HomeEmptyCopy;
  onAction: (route: '/profile/verification') => void;
}

const ICON_PATHS: Record<HomeEmptyNoticeIcon, string> = {
  shield: 'M12 3 5 6v5c0 4.55 2.98 8.74 7 10 4.02-1.26 7-5.45 7-10V6l-7-3Zm-1 12.17-3-3L9.41 10.76 11 12.34l3.59-3.59L16 10.17l-5 5Z',
  clock: 'M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm1 11h-5V11h3V6h2v7Z',
  diamond: 'm12 3 9 9-9 9-9-9 9-9Zm0 3.83L6.83 12 12 17.17 17.17 12 12 6.83Z',
  check: 'M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm-1.41 14.59-3.5-3.5 1.42-1.42 2.08 2.09 4.9-4.91 1.42 1.42-6.32 6.32Z',
};

function NoticeIcon({ name }: { name: HomeEmptyNoticeIcon }) {
  return (
    <svg className={styles.noticeIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

export function EmptyTodayCard({ copy, onAction }: Props) {
  return (
    <main className={styles.root} data-testid="home-empty">
      <div className={styles.inner}>
        <p className={styles.kicker}>{copy.kicker}</p>
        <h1 className={styles.headline} aria-label={copy.title}>
          <span>{copy.headline.firstLine}</span>
          <span>
            {copy.headline.prefix}
            <em>{copy.headline.emphasis}</em>
            {copy.headline.suffix}
          </span>
        </h1>

        <div className={styles.divider} aria-hidden="true">
          <span />
          <b>◆</b>
          <span />
        </div>

        <section className={styles.notice} aria-label={copy.noticeTitle}>
          <NoticeIcon name={copy.noticeIcon} />
          <div>
            <p className={styles.noticeTitle}>{copy.noticeTitle}</p>
            <p className={styles.noticeBody}>{copy.description}</p>
          </div>
        </section>

        {copy.action ? (
          <button
            className={styles.primaryAction}
            type="button"
            onClick={() => onAction(copy.action!.route)}
          >
            {copy.action.label}
          </button>
        ) : null}

        <div className={styles.timer}>
          <p className={styles.timerValue}>12:00</p>
          <p className={styles.timerLabel}>{copy.timeLabel}</p>
        </div>

        <aside className={styles.editorNote} aria-label="Editor's note">
          <span className={styles.editorRule} aria-hidden="true" />
          <p className={styles.editorKicker}>EDITOR&apos;S NOTE</p>
          <p className={styles.editorBody}>{copy.editorNote}</p>
          <p className={styles.signature}>· Cupid</p>
        </aside>
      </div>
    </main>
  );
}
