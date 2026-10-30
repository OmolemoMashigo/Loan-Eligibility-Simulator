import type {
  CreditScoreRateBand,
  EligibilityRequest,
  LoanProduct,
  PersonalLoanPurpose,
} from './types';

/** SI-1, SI-2: the simulator prices Personal Loan only. */
export const PERSONAL_LOAN_ID = 'personal_loan' as const;

export const PERSONAL_LOAN_PURPOSES: readonly PersonalLoanPurpose[] = [
  'debt_consolidation',
  'home_improvement',
  'education',
  'medical',
  'other',
];

export const PERSONAL_LOAN_PRODUCT: LoanProduct = {
  id: PERSONAL_LOAN_ID,
  name: 'Personal Loan',
  description: 'Flexible personal financing for various needs',
  minAmount: 5_000,
  maxAmount: 300_000,
  minTerm: 6,
  maxTerm: 60,
  interestRateRange: {
    min: 10.5,
    max: 18.5,
  },
  purposes: PERSONAL_LOAN_PURPOSES,
};

/**
 * SI-6 / SI-8: bands sit inside the personal product range 10.5–18.5.
 * A score of 650 maps to 12.5, matching the spec sample rate (not the sample PMT).
 * Evaluated from the top: first band whose minScore is met wins.
 */
export const CREDIT_SCORE_RATE_BANDS: readonly CreditScoreRateBand[] = [
  { minScore: 750, annualRatePercent: 10.5 },
  { minScore: 700, annualRatePercent: 11.5 },
  { minScore: 650, annualRatePercent: 12.5 },
  { minScore: 600, annualRatePercent: 14.5 },
  { minScore: 550, annualRatePercent: 16.5 },
  { minScore: 0, annualRatePercent: 18.5 },
];

/** SI-8: blank credit score uses a conservative mid-range rate, not 0. */
export const UNKNOWN_CREDIT_SCORE_RATE_PERCENT = 14.5;

/** SI-7: DTI is existingDebt / monthlyIncome * 100. */
export const DEBT_TO_INCOME_INCOME_MONTHS = 1;

/**
 * SI-7: LTI is requestedAmount / (monthlyIncome * 12) * 100.
 * The spec sample prints 60.0; the formula yields 50.0 for those inputs.
 */
export const LOAN_TO_INCOME_INCOME_MONTHS = 12;

/**
 * Maximum affordable payment as a share of disposable income.
 * Inverse-PMT at 85% of the sample disposable (~R10,000) is ~R179,676.
 */
export const MAX_PAYMENT_TO_DISPOSABLE_RATIO = 0.85;

/** Round max affordable principal to the nearest R5,000 (reproduces sample R180,000). */
export const MAX_AMOUNT_ROUNDING_INCREMENT = 5_000;

/**
 * Affordability score from repayment / disposable.
 * Sample payment is ~70.9% of disposable and the spec labels that "good".
 */
export const AFFORDABILITY_SCORE_THRESHOLDS = {
  excellent: 0.4,
  good: 0.72,
  fair: 0.85,
} as const;

export const APPROVAL_SCORE_WEIGHTS = {
  repaymentToDisposable: 40,
  debtToIncome: 20,
  creditBand: 25,
  employment: 15,
} as const;

export const RISK_CATEGORY_THRESHOLDS = {
  low: 80,
  medium: 60,
} as const;

/** Lower interest rate (better credit band) maps to a higher score. */
export const CREDIT_RATE_COMPONENT_SCORES: readonly {
  annualRatePercent: number;
  score: number;
}[] = [
  { annualRatePercent: 10.5, score: 100 },
  { annualRatePercent: 11.5, score: 90 },
  { annualRatePercent: 12.5, score: 80 },
  { annualRatePercent: 14.5, score: 55 },
  { annualRatePercent: 16.5, score: 40 },
  { annualRatePercent: 18.5, score: 25 },
];

export const UNEMPLOYED_EMPLOYMENT_SCORE = 25;
export const RETIRED_EMPLOYMENT_SCORE = 55;
/** 24 months of employment maps to a full employment-component score. */
export const EMPLOYMENT_DURATION_FULL_SCORE_MONTHS = 24;

/** SI-4: age 18–65 for every status, including retired. */
export const AGE_MIN = 18;
export const AGE_MAX = 65;

/** SI-16: spec uses a FICO-like scale, not a typical SA bureau scale. */
export const CREDIT_SCORE_MIN = 300;
export const CREDIT_SCORE_MAX = 850;

/** SI-3: duration required only for employed and self_employed. */
export const EMPLOYMENT_DURATION_MIN_MONTHS = 3;

/** SI-9: no spec max; 600 months is 50 years. */
export const EMPLOYMENT_DURATION_MAX_MONTHS = 600;

/** SI-9: no spec max for income or expenses. */
export const MONTHLY_INCOME_MIN = 5_000;
export const MONTHLY_INCOME_MAX = 10_000_000;
export const MONTHLY_EXPENSES_MIN = 0;
export const MONTHLY_EXPENSES_MAX = 10_000_000;

/** SI-9: existingDebt is required, 0 is valid, no spec max. */
export const EXISTING_DEBT_MIN = 0;
export const EXISTING_DEBT_MAX = 10_000_000;

export const CURRENCY_CODE = 'ZAR';
export const LOCALE = 'en-ZA';

export const SIMULATED_LATENCY_MS = {
  min: 300,
  max: 800,
} as const;

export const TEST_LATENCY_MS = 0;

/** Demo-only server error. Not shown in the UI. */
export const MOCK_ERROR_QUERY_PARAM = 'mockError';
export const MOCK_ERROR_QUERY_VALUE = '500';

export const ENGINE_CONFIG = {
  personalLoan: PERSONAL_LOAN_PRODUCT,
  creditScoreRateBands: CREDIT_SCORE_RATE_BANDS,
  unknownCreditScoreRatePercent: UNKNOWN_CREDIT_SCORE_RATE_PERCENT,
  debtToIncomeIncomeMonths: DEBT_TO_INCOME_INCOME_MONTHS,
  loanToIncomeIncomeMonths: LOAN_TO_INCOME_INCOME_MONTHS,
  maxPaymentToDisposableRatio: MAX_PAYMENT_TO_DISPOSABLE_RATIO,
  maxAmountRoundingIncrement: MAX_AMOUNT_ROUNDING_INCREMENT,
  affordabilityScoreThresholds: AFFORDABILITY_SCORE_THRESHOLDS,
  approvalScoreWeights: APPROVAL_SCORE_WEIGHTS,
  riskCategoryThresholds: RISK_CATEGORY_THRESHOLDS,
  simulatedLatencyMs: SIMULATED_LATENCY_MS,
  testLatencyMs: TEST_LATENCY_MS,
} as const;

/**
 * Spec sample request. Use this in tests.
 * Eligibility stays true; LTI and PMT will not match the printed sample (SI-6, SI-7).
 */
export const SPEC_SAMPLE_REQUEST: EligibilityRequest = {
  personalInfo: {
    age: 35,
    employmentStatus: 'employed',
    employmentDuration: 24,
  },
  financialInfo: {
    monthlyIncome: 25_000,
    monthlyExpenses: 15_000,
    existingDebt: 5_000,
    creditScore: 650,
  },
  loanDetails: {
    requestedAmount: 150_000,
    loanTerm: 24,
    loanPurpose: 'home_improvement',
  },
};
