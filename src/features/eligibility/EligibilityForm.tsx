import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
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
  type EligibilityResponse,
} from '@/api';
import { Alert } from '@/components/Alert/Alert';
import { cx } from '@/components/cx';
import { resetWindowScroll, revealScreen } from '@/lib/revealScreen';
import { LoadingBlock } from '@/components/LoadingBlock/LoadingBlock';
import { stepPanelId, stepTabId } from '@/components/StepTabs/ids';
import { StepTabs } from '@/components/StepTabs/StepTabs';
import {
  buildEligibilityFormSchema,
  buildFormFieldMeta,
  type EligibilityFormRules,
} from './buildFormSchema';
import { DeclineNextSteps } from './DeclineNextSteps';
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
import { FORM_STEPS, LAST_STEP, stepIndexOfPath, type FormStep } from './steps';
import { buildScheduleRequest } from './scheduleRequest';
import { ScheduleSection } from './ScheduleSection';
import { WhatIfCard } from './WhatIfCard';

type ShownResult = {
  request: EligibilityRequest;
  response: EligibilityResponse;
};

/** Where to put keyboard focus once the next screen has appeared. */
type FocusRequest = { step: number } | { field: string };

function Lede() {
  return (
    <p className={styles.lede}>
      Enter your details to estimate personal loan eligibility.
    </p>
  );
}

function ArrowIcon({ direction }: { direction: 'back' | 'next' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={
          direction === 'next'
            ? 'M5 12h14m-6-6 6 6-6 6'
            : 'M19 12H5m6-6-6 6 6 6'
        }
      />
    </svg>
  );
}

export function EligibilityForm() {
  const rulesQuery = useValidationRules();
  const productsQuery = useLoanProducts();

  if (rulesQuery.isPending || productsQuery.isPending) {
    return (
      <>
        <Lede />
        <LoadingBlock label="Loading the form" />
      </>
    );
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
      <>
        <Lede />
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
      </>
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
  // A second mutation, so a what-if recalculation never clears the result.
  const recalculate = useCheckEligibility();
  // The result on screen: the last good one, even while a newer one loads.
  const [shown, setShown] = useState<ShownResult>();
  // Bumped on every new submit, so a late what-if answer can be ignored.
  const generation = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const stepsId = useId();
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  // The step on screen, and how many steps (from the first) are finished.
  const [active, setActive] = useState(0);
  const [done, setDone] = useState(0);
  const [focusRequest, setFocusRequest] = useState<FocusRequest>();
  const [summary, setSummary] = useState<ErrorSummaryItem[]>();
  // New key = new alert node = focus moves to the latest message.
  const [feedbackKey, setFeedbackKey] = useState(0);
  const pending = checkEligibility.isPending;

  function showFeedback() {
    setFeedbackKey((key) => key + 1);
  }

  // Runs after the screen it points at has appeared, so the target is visible.
  useEffect(() => {
    if (!focusRequest) {
      return;
    }

    if ('field' in focusRequest) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${focusRequest.field}"]`)
        ?.focus();
    } else {
      revealScreen(panels.current[focusRequest.step] ?? null);
    }
  }, [focusRequest]);

  function summaryFor(step: FormStep): ErrorSummaryItem[] {
    const messages: Record<string, string> = {};

    for (const path of step.fields) {
      const message = form.getFieldState(path).error?.message;

      if (message !== undefined) {
        messages[path] = message;
      }
    }

    return summariseFieldMessages(messages);
  }

  /** Checks one step's fields, showing their errors. */
  async function validateStep(index: number): Promise<boolean> {
    const step = FORM_STEPS[index];

    if (!step || (await form.trigger([...step.fields]))) {
      setSummary(undefined);
      return true;
    }

    setSummary(summaryFor(step));
    showFeedback();
    return false;
  }

  /**
   * Opens a step. Going forward checks every step on the way, and stops at the
   * first one with a problem so nobody skips past a mistake.
   */
  async function goToStep(target: number, moveFocus: boolean) {
    if (target === active || target < 0 || target > LAST_STEP) {
      return;
    }

    if (target > active) {
      for (let index = active; index < target; index += 1) {
        if (!(await validateStep(index))) {
          setActive(index);
          return;
        }
      }

      setDone((count) => Math.max(count, target));
    } else {
      setSummary(undefined);
    }

    setActive(target);

    if (moveFocus) {
      setFocusRequest({ step: target });
    } else {
      resetWindowScroll();
    }
  }

  function editDetails() {
    generation.current += 1;
    recalculate.reset();
    setShown(undefined);
    setActive(0);
    setFocusRequest({ step: 0 });
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

        const first = items[0];

        if (first) {
          setActive(stepIndexOfPath(first.path));
        }
      }
    }

    showFeedback();
  }

  function send(request: EligibilityRequest) {
    setSummary(undefined);
    setShown(undefined);
    generation.current += 1;
    recalculate.reset();
    checkEligibility.mutate(request, {
      onSuccess: (response) => {
        setShown({ request, response });
        setDone(FORM_STEPS.length);
        showFeedback();
      },
      onError: handleSubmitError,
    });
  }

  // No showFeedback here: a refresh must not pull focus off the fields.
  function recalculateWith(request: EligibilityRequest) {
    const run = generation.current;

    recalculate.mutate(request, {
      onSuccess: (response) => {
        if (run === generation.current) {
          setShown({ request, response });
        }
      },
    });
  }

  function onInvalid(errors: FieldErrors) {
    const items = summariseFormErrors(errors);
    const first = items[0];

    setSummary(items);
    showFeedback();

    // Open the first step with a problem, so the summary links lead somewhere.
    if (first) {
      setActive(stepIndexOfPath(first.path));
    }
  }

  function focusField(path: string) {
    if (stepIndexOfPath(path) === active) {
      formRef.current?.querySelector<HTMLElement>(`[name="${path}"]`)?.focus();
    } else {
      setActive(stepIndexOfPath(path));
      setFocusRequest({ field: path });
    }
  }

  function renderStep(step: FormStep) {
    switch (step.id) {
      case 'loan':
        return <LoanDetailsSection meta={meta} productName={product.name} />;
      case 'personal':
        return <PersonalDetailsSection meta={meta} />;
      case 'money':
        return <FinancialDetailsSection meta={meta} />;
    }
  }

  const failed = checkEligibility.isError && !summary;
  const scheduleRequest = shown
    ? buildScheduleRequest(
        shown.request,
        shown.response.recommendedLoan.recommendedAmount,
      )
    : undefined;

  const showResult = shown !== undefined && !summary;

  return (
    <FormProvider {...form}>
      {showResult ? (
        <div className={styles.results}>
          <button
            className={cx(styles.secondary, styles.edit)}
            type="button"
            onClick={editDetails}
          >
            <ArrowIcon direction="back" />
            Edit your details
          </button>
          <EligibilityResult
            key={feedbackKey}
            response={shown.response}
            loanTerm={shown.request.loanDetails.loanTerm}
            creditScoreMissing={
              shown.request.financialInfo.creditScore === undefined
            }
            updating={recalculate.isPending}
            nextSteps={
              shown.response.eligibilityResult.isEligible ? undefined : (
                <DeclineNextSteps
                  maxAmount={shown.response.recommendedLoan.maxAmount}
                  requestedAmount={shown.request.loanDetails.requestedAmount}
                  loanTerm={shown.request.loanDetails.loanTerm}
                  maxTerm={meta.loanDetails.loanTerm.max}
                  disposableIncome={
                    shown.response.affordabilityAnalysis.disposableIncome
                  }
                  onEditDetails={editDetails}
                />
              )
            }
            adjust={
              <WhatIfCard
                schema={schema}
                rules={meta.loanDetails}
                request={shown.request}
                updating={recalculate.isPending}
                failure={
                  recalculate.isError
                    ? isApiError(recalculate.error)
                      ? recalculate.error.message
                      : 'Please try again.'
                    : undefined
                }
                onRecalculate={recalculateWith}
                onRetry={() => {
                  if (recalculate.variables) {
                    recalculateWith(recalculate.variables);
                  }
                }}
              />
            }
          >
            {scheduleRequest ? (
              <ScheduleSection request={scheduleRequest} />
            ) : null}
          </EligibilityResult>
        </div>
      ) : (
        <Lede />
      )}
      {/* Kept on the page, only hidden, so every answer is still there when the
          user comes back from the result to edit. */}
      <form
        ref={formRef}
        className={styles.form}
        aria-label="Loan eligibility"
        noValidate
        hidden={showResult}
        onSubmit={(event) => {
          if (pending) {
            event.preventDefault();
            return;
          }

          // Enter inside a field moves on, the same as the Next button.
          if (active < LAST_STEP) {
            event.preventDefault();
            void goToStep(active + 1, true);
            return;
          }

          void form.handleSubmit(send, onInvalid)(event);
        }}
      >
        <StepTabs
          label="Form steps"
          steps={FORM_STEPS}
          active={active}
          reached={Math.min(done, LAST_STEP)}
          done={done}
          idPrefix={stepsId}
          onSelect={(index) => {
            void goToStep(index, false);
          }}
        />
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
        {FORM_STEPS.map((step, index) => (
          <div
            key={step.id}
            ref={(node) => {
              panels.current[index] = node;
            }}
            id={stepPanelId(stepsId, index)}
            className={styles.panel}
            role="tabpanel"
            aria-labelledby={stepTabId(stepsId, index)}
            tabIndex={-1}
            hidden={index !== active}
          >
            {renderStep(step)}
            {index === active ? (
              <div className={styles.actions}>
                {index > 0 ? (
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => {
                      void goToStep(index - 1, true);
                    }}
                  >
                    <ArrowIcon direction="back" />
                    Back
                  </button>
                ) : null}
                <button
                  type="submit"
                  className={styles.submit}
                  aria-disabled={pending ? true : undefined}
                >
                  {index === LAST_STEP ? (
                    pending ? (
                      'Checking…'
                    ) : (
                      'Check my eligibility'
                    )
                  ) : (
                    <>
                      Next
                      <ArrowIcon direction="next" />
                    </>
                  )}
                </button>
              </div>
            ) : null}
          </div>
        ))}
        {active === LAST_STEP && pending ? (
          <LoadingBlock label="Checking your eligibility" />
        ) : null}
        {active === LAST_STEP && failed ? (
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
      </form>
    </FormProvider>
  );
}

function focusOnMount(node: HTMLDivElement | null) {
  node?.focus();
}
