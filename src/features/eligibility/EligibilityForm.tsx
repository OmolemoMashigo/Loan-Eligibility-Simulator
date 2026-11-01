import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useRef, useState } from 'react';
import {
  FormProvider,
  useForm,
  type FieldErrors,
  type Path,
} from 'react-hook-form';
import {
  isApiError,
  useCheckEligibility,
  useLoanProducts,
  useValidationRules,
  type EligibilityRequest,
} from '@/api';
import { Alert } from '@/components/Alert/Alert';
import { LoadingBlock } from '@/components/LoadingBlock/LoadingBlock';
import {
  buildEligibilityFormSchema,
  buildFormFieldMeta,
  type EligibilityFormRules,
} from './buildFormSchema';
import styles from './EligibilityForm.module.css';
import { EligibilityResult } from './EligibilityResult';
import {
  summariseFieldMessages,
  summariseFormErrors,
  type ErrorSummaryItem,
} from './errorSummary';
import { FinancialDetailsSection } from './FinancialDetailsSection';
import {
  emptyEligibilityFormValues,
  type EligibilityFormValues,
} from './formDefaults';
import { LoanDetailsSection } from './LoanDetailsSection';
import {
  applyProductToDefaults,
  applyProductToRules,
  selectPersonalLoanProduct,
  type LoanProductInfo,
} from './loanProduct';
import { PersonalDetailsSection } from './PersonalDetailsSection';

export function EligibilityForm() {
  const rulesQuery = useValidationRules();
  const productsQuery = useLoanProducts();

  if (rulesQuery.isPending || productsQuery.isPending) {
    return <LoadingBlock label="Loading the form" />;
  }

  const failedQuery = rulesQuery.isError
    ? rulesQuery
    : productsQuery.isError
      ? productsQuery
      : undefined;
  const personalLoan = productsQuery.data
    ? selectPersonalLoanProduct(productsQuery.data.products)
    : undefined;

  if (failedQuery || !rulesQuery.data || !personalLoan) {
    return (
      <Alert tone="danger" title="We could not load the form">
        <p>
          {failedQuery && isApiError(failedQuery.error)
            ? failedQuery.error.message
            : 'Please try again.'}
        </p>
        <button
          className={styles.retry}
          type="button"
          onClick={() => {
            void rulesQuery.refetch();
            void productsQuery.refetch();
          }}
        >
          Try again
        </button>
      </Alert>
    );
  }

  return (
    <EligibilityFormFields rules={rulesQuery.data} product={personalLoan} />
  );
}

function EligibilityFormFields({
  rules,
  product,
}: {
  rules: EligibilityFormRules;
  product: LoanProductInfo;
}) {
  const { schema, meta } = useMemo(() => {
    const effectiveRules = applyProductToRules(rules, product);
    const defaults = applyProductToDefaults(product);

    return {
      schema: buildEligibilityFormSchema(effectiveRules, defaults),
      meta: buildFormFieldMeta(effectiveRules, defaults),
    };
  }, [rules, product]);
  const form = useForm({
    defaultValues: emptyEligibilityFormValues(),
    resolver: zodResolver(schema),
    mode: 'onBlur',
    // The error summary takes focus instead, and links to each field.
    shouldFocusError: false,
  });
  const checkEligibility = useCheckEligibility();
  const formRef = useRef<HTMLFormElement>(null);
  const [summary, setSummary] = useState<ErrorSummaryItem[]>();
  // New key = new alert node = focus moves to the latest message.
  const [feedbackKey, setFeedbackKey] = useState(0);
  const pending = checkEligibility.isPending;

  function showFeedback() {
    setFeedbackKey((key) => key + 1);
  }

  function handleSubmitError(error: Error) {
    if (isApiError(error) && error.kind === 'validation' && error.fieldErrors) {
      const items = summariseFieldMessages(error.fieldErrors);

      if (items.length > 0) {
        for (const { path, message } of items) {
          form.setError(path as Path<EligibilityFormValues>, {
            type: 'server',
            message,
          });
        }

        setSummary(items);
      }
    }

    showFeedback();
  }

  function send(request: EligibilityRequest) {
    setSummary(undefined);
    checkEligibility.mutate(request, {
      onSuccess: showFeedback,
      onError: handleSubmitError,
    });
  }

  function onInvalid(errors: FieldErrors) {
    setSummary(summariseFormErrors(errors));
    showFeedback();
  }

  function focusField(path: string) {
    formRef.current?.querySelector<HTMLElement>(`[name="${path}"]`)?.focus();
  }

  const failed = checkEligibility.isError && !summary;

  return (
    <FormProvider {...form}>
      <form
        ref={formRef}
        className={styles.form}
        aria-label="Loan eligibility"
        noValidate
        onSubmit={(event) => {
          if (pending) {
            event.preventDefault();
            return;
          }

          void form.handleSubmit(send, onInvalid)(event);
        }}
      >
        {summary && summary.length > 0 ? (
          <Alert
            key={feedbackKey}
            ref={focusOnMount}
            tone="danger"
            title={`Please fix ${summary.length} ${
              summary.length === 1 ? 'problem' : 'problems'
            } before continuing`}
          >
            <ul className={styles.summaryList}>
              {summary.map((item) => (
                <li key={item.path}>
                  <button
                    type="button"
                    className={styles.summaryLink}
                    onClick={() => {
                      focusField(item.path);
                    }}
                  >
                    {item.label}: {item.message}
                  </button>
                </li>
              ))}
            </ul>
          </Alert>
        ) : null}
        <PersonalDetailsSection meta={meta} />
        <FinancialDetailsSection meta={meta} />
        <LoanDetailsSection meta={meta} productName={product.name} />
        <button
          type="submit"
          className={styles.submit}
          aria-disabled={pending ? true : undefined}
        >
          {pending ? 'Checking…' : 'Check my eligibility'}
        </button>
        {pending ? <LoadingBlock label="Checking your eligibility" /> : null}
        {failed ? (
          <Alert
            key={feedbackKey}
            ref={focusOnMount}
            tone="danger"
            title="We could not check your eligibility"
          >
            <p>
              {isApiError(checkEligibility.error)
                ? checkEligibility.error.message
                : 'Please try again.'}
            </p>
            <button
              className={styles.retry}
              type="button"
              onClick={() => {
                if (checkEligibility.variables) {
                  send(checkEligibility.variables);
                }
              }}
            >
              Try again
            </button>
          </Alert>
        ) : null}
        {checkEligibility.isSuccess && !summary ? (
          <EligibilityResult
            key={feedbackKey}
            response={checkEligibility.data}
            loanTerm={checkEligibility.variables.loanDetails.loanTerm}
          />
        ) : null}
      </form>
    </FormProvider>
  );
}

function focusOnMount(node: HTMLDivElement | null) {
  node?.focus();
}
