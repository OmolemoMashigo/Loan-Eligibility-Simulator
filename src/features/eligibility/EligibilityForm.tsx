import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { isApiError, useValidationRules } from '@/api';
import { Alert } from '@/components/Alert/Alert';
import { LoadingBlock } from '@/components/LoadingBlock/LoadingBlock';
import {
  buildEligibilityFormSchema,
  buildFormFieldMeta,
} from './buildFormSchema';
import styles from './EligibilityForm.module.css';
import { emptyEligibilityFormValues } from './formDefaults';
import { PersonalDetailsSection } from './PersonalDetailsSection';

export function EligibilityForm() {
  const rulesQuery = useValidationRules();

  if (rulesQuery.isPending) {
    return <LoadingBlock label="Loading the form" />;
  }

  if (rulesQuery.isError || !rulesQuery.data) {
    return (
      <Alert tone="danger" title="We could not load the form">
        <p>
          {isApiError(rulesQuery.error)
            ? rulesQuery.error.message
            : 'Please try again.'}
        </p>
        <button
          className={styles.retry}
          type="button"
          onClick={() => {
            void rulesQuery.refetch();
          }}
        >
          Try again
        </button>
      </Alert>
    );
  }

  return <EligibilityFormFields rules={rulesQuery.data} />;
}

function EligibilityFormFields({
  rules,
}: {
  rules: Parameters<typeof buildEligibilityFormSchema>[0];
}) {
  const schema = useMemo(() => buildEligibilityFormSchema(rules), [rules]);
  const meta = useMemo(() => buildFormFieldMeta(rules), [rules]);
  const form = useForm({
    defaultValues: emptyEligibilityFormValues(),
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  return (
    <FormProvider {...form}>
      <form className={styles.form} aria-label="Loan eligibility" noValidate>
        <PersonalDetailsSection meta={meta} />
      </form>
    </FormProvider>
  );
}
