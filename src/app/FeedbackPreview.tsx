import { useState } from 'react';
import { Alert } from '@/components/Alert/Alert';
import { LoadingBlock } from '@/components/LoadingBlock/LoadingBlock';
import { Spinner } from '@/components/Spinner/Spinner';
import styles from './ControlPreview.module.css';

export function FeedbackPreview() {
  return (
    <section className={styles.form} aria-label="Sample feedback">
      <h2 className={styles.title}>Sample alerts and loading</h2>
      <Alert tone="success" title="Eligible" live="off">
        <p>This is an estimate, not a credit offer.</p>
      </Alert>
      <Alert tone="danger" title="Not eligible" live="off">
        <p>Try a lower amount or a longer term.</p>
      </Alert>
      <Alert tone="warning" title="Add your credit score">
        <p>A score gives a more accurate estimate.</p>
      </Alert>
      <Alert tone="info" title="Checking your details">
        <p>This can take a few seconds.</p>
      </Alert>
      <LoadingBlock label="Checking eligibility" />
      <p>
        Inline spinner: <Spinner label="Loading products" />
      </p>
      <CrashPreview />
    </section>
  );
}

function CrashPreview() {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error('Preview crash');
  }

  return (
    <button
      type="button"
      className={styles.crash}
      onClick={() => {
        setShouldCrash(true);
      }}
    >
      Crash the preview
    </button>
  );
}
