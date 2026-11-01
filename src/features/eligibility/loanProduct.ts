import type { EligibilityFormRules } from './buildFormSchema';
import {
  FORM_VALIDATION_DEFAULTS,
  type FormValidationDefaults,
} from './formDefaults';

/** The product fields the form reads. Fits the API response and the mock fixture. */
export type LoanProductInfo = {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  purposes: readonly string[];
};

/** SI-1, SI-2: the simulator prices Personal Loan only. */
export const SIMULATED_LOAN_PRODUCT_ID = 'personal_loan';

export function selectPersonalLoanProduct(
  products: readonly LoanProductInfo[],
): LoanProductInfo | undefined {
  return products.find((product) => product.id === SIMULATED_LOAN_PRODUCT_ID);
}

/**
 * SI-1: the product list sets the loan bounds. Where the validation rules
 * also set a bound, the stricter one wins. Rule messages are kept.
 */
export function applyProductToRules(
  rules: EligibilityFormRules,
  product: LoanProductInfo,
): EligibilityFormRules {
  const { requestedAmount, loanTerm } = rules.loanDetails;

  return {
    ...rules,
    loanDetails: {
      requestedAmount: {
        ...requestedAmount,
        min: Math.max(
          requestedAmount.min ?? product.minAmount,
          product.minAmount,
        ),
        max: Math.min(
          requestedAmount.max ?? product.maxAmount,
          product.maxAmount,
        ),
      },
      loanTerm: {
        ...loanTerm,
        min: Math.max(loanTerm.min ?? product.minTerm, product.minTerm),
        max: Math.min(loanTerm.max ?? product.maxTerm, product.maxTerm),
      },
    },
  };
}

/** SI-9: the product list supplies the purpose options the rules omit. */
export function applyProductToDefaults(
  product: LoanProductInfo,
  defaults: FormValidationDefaults = FORM_VALIDATION_DEFAULTS,
): FormValidationDefaults {
  return {
    ...defaults,
    loanPurpose: {
      ...defaults.loanPurpose,
      options: [...product.purposes],
    },
  };
}
