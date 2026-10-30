import {
  AGE_MAX,
  AGE_MIN,
  CREDIT_SCORE_MAX,
  CREDIT_SCORE_MIN,
  EMPLOYMENT_DURATION_MAX_MONTHS,
  EMPLOYMENT_DURATION_MIN_MONTHS,
  EXISTING_DEBT_MAX,
  EXISTING_DEBT_MIN,
  MONTHLY_EXPENSES_MAX,
  MONTHLY_EXPENSES_MIN,
  MONTHLY_INCOME_MAX,
  MONTHLY_INCOME_MIN,
  PERSONAL_LOAN_PRODUCT,
  PERSONAL_LOAN_PURPOSES,
} from './config';
import type {
  EmploymentStatus,
  NumericFieldRule,
  PersonalLoanPurpose,
  ValidationRulesResponse,
} from './types';

export const EMPLOYMENT_STATUS_OPTIONS: readonly EmploymentStatus[] = [
  'employed',
  'self_employed',
  'unemployed',
  'retired',
];

/** Spec GET /api/loans/validation-rules body. */
export const VALIDATION_RULES_RESPONSE: ValidationRulesResponse = {
  personalInfo: {
    age: {
      min: AGE_MIN,
      max: AGE_MAX,
      required: true,
      errorMessage: 'Age must be between 18 and 65',
    },
    employmentStatus: {
      required: true,
      options: EMPLOYMENT_STATUS_OPTIONS,
      errorMessage: 'Please select your employment status',
    },
    employmentDuration: {
      min: EMPLOYMENT_DURATION_MIN_MONTHS,
      required: true,
      errorMessage: 'Minimum 3 months employment required',
    },
  },
  financialInfo: {
    monthlyIncome: {
      min: MONTHLY_INCOME_MIN,
      required: true,
      errorMessage: 'Minimum monthly income of R5,000 required',
    },
    monthlyExpenses: {
      min: MONTHLY_EXPENSES_MIN,
      required: true,
      errorMessage: 'Please enter your monthly expenses',
    },
    creditScore: {
      min: CREDIT_SCORE_MIN,
      max: CREDIT_SCORE_MAX,
      required: false,
      errorMessage: 'Credit score must be between 300 and 850',
    },
  },
  loanDetails: {
    requestedAmount: {
      min: PERSONAL_LOAN_PRODUCT.minAmount,
      max: PERSONAL_LOAN_PRODUCT.maxAmount,
      required: true,
      errorMessage: 'Loan amount must be between R5,000 and R300,000',
    },
    loanTerm: {
      min: PERSONAL_LOAN_PRODUCT.minTerm,
      max: PERSONAL_LOAN_PRODUCT.maxTerm,
      required: true,
      errorMessage: 'Loan term must be between 6 and 60 months',
    },
  },
};

/** SI-9: fields the spec omitted. */
export const LOCAL_VALIDATION_DEFAULTS = {
  existingDebt: {
    min: EXISTING_DEBT_MIN,
    max: EXISTING_DEBT_MAX,
    required: true,
    errorMessage:
      'Please enter your total existing debt. Use 0 if you have none',
  } satisfies NumericFieldRule,
  loanPurpose: {
    required: true,
    options: PERSONAL_LOAN_PURPOSES,
    errorMessage: 'Please select a loan purpose',
  },
  monthlyIncomeMax: MONTHLY_INCOME_MAX,
  monthlyExpensesMax: MONTHLY_EXPENSES_MAX,
  employmentDurationMax: EMPLOYMENT_DURATION_MAX_MONTHS,
  personalLoanPurposes:
    PERSONAL_LOAN_PURPOSES as readonly PersonalLoanPurpose[],
};
