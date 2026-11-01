import { PageLayout } from '@/app/PageLayout';
import { EligibilityForm } from '@/features/eligibility/EligibilityForm';
import styles from './App.module.css';

export function App() {
  return (
    <PageLayout>
      <p className={styles.lede}>
        Enter your details to estimate personal loan eligibility.
      </p>
      <EligibilityForm />
    </PageLayout>
  );
}
