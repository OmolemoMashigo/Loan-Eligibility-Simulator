import { useEffect, type ReactNode } from 'react';
import { installHistoryGuard } from '@/lib/historyGuard';
import { Disclaimer } from './Disclaimer';
import { Header } from './Header';
import { SkipLink } from './SkipLink';
import styles from './PageLayout.module.css';

export type PageLayoutProps = {
  children: ReactNode;
};

export function PageLayout({ children }: PageLayoutProps) {
  useEffect(() => installHistoryGuard(), []);

  return (
    <div className={styles.page}>
      <SkipLink />
      <Header />
      <main id="main-content" className={styles.main} tabIndex={-1}>
        <Disclaimer />
        {children}
      </main>
    </div>
  );
}
