import { ControlPreview } from '@/app/ControlPreview';
import { FeedbackPreview } from '@/app/FeedbackPreview';
import styles from './App.module.css';

export function App() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Loan Eligibility Simulator</h1>
      <p className={styles.lede}>The eligibility form will live here.</p>
      <ControlPreview />
      <FeedbackPreview />
    </main>
  );
}
