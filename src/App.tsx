import { PageLayout } from '@/app/PageLayout';
import styles from './App.module.css';

export function App() {
  return (
    <PageLayout>
      <p className={styles.lede}>
        Enter your details to estimate personal loan eligibility.
      </p>
    </PageLayout>
  );
}
