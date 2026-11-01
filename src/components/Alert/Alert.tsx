import { useId, type ReactNode, type Ref } from 'react';
import { cx } from '@/components/cx';
import styles from './Alert.module.css';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

export type AlertProps = {
  tone: AlertTone;
  title: string;
  children?: ReactNode;
  live?: 'polite' | 'assertive' | 'off';
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

const TONE_LABEL: Record<AlertTone, string> = {
  info: 'Information',
  success: 'Success',
  warning: 'Warning',
  danger: 'Error',
};

export function Alert({
  tone,
  title,
  children,
  live,
  className,
  ref,
}: AlertProps) {
  const titleId = useId();
  const politeness =
    live ?? (tone === 'danger' || tone === 'warning' ? 'assertive' : 'polite');
  const role =
    politeness === 'off'
      ? 'region'
      : politeness === 'assertive'
        ? 'alert'
        : 'status';

  return (
    <div
      ref={ref}
      className={cx(styles.alert, styles[tone], className)}
      role={role}
      aria-live={politeness === 'off' ? undefined : politeness}
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <span className={styles.icon} aria-hidden="true">
        <ToneIcon tone={tone} />
      </span>
      <div className={styles.body}>
        <p className={styles.title} id={titleId}>
          <span className={styles.visuallyHidden}>{TONE_LABEL[tone]}: </span>
          {title}
        </p>
        {children ? <div className={styles.detail}>{children}</div> : null}
      </div>
    </div>
  );
}

function ToneIcon({ tone }: { tone: AlertTone }) {
  switch (tone) {
    case 'success':
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4-6 6Z" />
        </svg>
      );
    case 'warning':
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M1.5 20.5 12 2.5l10.5 18H1.5Zm10.5-3a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm-1.1-7h2.2v5h-2.2v-5Z" />
        </svg>
      );
    case 'danger':
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 14h-2v-2h2v2Zm0-4h-2V7h2v5Z" />
        </svg>
      );
    case 'info':
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" />
        </svg>
      );
  }
}
