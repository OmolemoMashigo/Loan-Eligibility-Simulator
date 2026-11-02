import type { CSSProperties } from 'react';
import { cx } from '@/components/cx';
import styles from './LikelihoodRing.module.css';

export type LikelihoodRingProps = {
  /** A percentage from 0 to 100. */
  percent: number;
  /** Matches the banner the ring sits in. */
  tone: 'success' | 'warning';
};

/**
 * A small decorative ring that fills to the approval likelihood. The value is
 * always shown as text beside it, so the ring is hidden from assistive tech.
 */
export function LikelihoodRing({ percent, tone }: LikelihoodRingProps) {
  const filled = Math.min(100, Math.max(0, percent));
  const style = { '--filled': filled } as CSSProperties;

  return (
    <svg
      className={cx(styles.ring, styles[tone])}
      style={style}
      viewBox="0 0 36 36"
      fill="none"
      strokeWidth="3.6"
      aria-hidden="true"
      focusable="false"
    >
      <circle className={styles.track} cx="18" cy="18" r="15.9155" />
      <circle className={styles.fill} cx="18" cy="18" r="15.9155" />
    </svg>
  );
}
