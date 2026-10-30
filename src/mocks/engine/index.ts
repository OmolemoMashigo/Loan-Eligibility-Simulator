export {
  calculateAmortisationSchedule,
  calculateMonthlyPayment,
  fromCents,
  monthlyRateFromAnnualPercent,
  roundToCents,
  toCents,
} from './amortisation';
export type { AmortisationInput, AmortisationResult } from './amortisation';
export { selectAnnualInterestRate } from './rates';
export {
  analyseAffordability,
  calculateDebtToIncomeRatio,
  calculateDisposableIncome,
  calculateLoanToIncomeRatio,
  calculateMaxAffordableAmount,
  scoreAffordability,
} from './affordability';
export type {
  AffordabilityBreakdown,
  AffordabilityInput,
} from './affordability';
export {
  calculateApprovalLikelihood,
  evaluateEligibility,
  riskFromLikelihood,
} from './decision';
export {
  validateCalculateRateRequest,
  validateEligibilityRequest,
} from './validate';
export type {
  ValidationFailure,
  ValidationResult,
  ValidationSuccess,
} from './validate';
export {
  EMPLOYMENT_STATUS_OPTIONS,
  LOCAL_VALIDATION_DEFAULTS,
  VALIDATION_RULES_RESPONSE,
} from './validationRules';

export {
  AFFORDABILITY_SCORE_THRESHOLDS,
  AGE_MAX,
  AGE_MIN,
  APPROVAL_SCORE_WEIGHTS,
  CREDIT_SCORE_MAX,
  CREDIT_SCORE_MIN,
  CREDIT_RATE_COMPONENT_SCORES,
  CREDIT_SCORE_RATE_BANDS,
  CURRENCY_CODE,
  EMPLOYMENT_DURATION_FULL_SCORE_MONTHS,
  EMPLOYMENT_DURATION_MAX_MONTHS,
  EMPLOYMENT_DURATION_MIN_MONTHS,
  ENGINE_CONFIG,
  EXISTING_DEBT_MAX,
  EXISTING_DEBT_MIN,
  LOCALE,
  LOAN_TO_INCOME_INCOME_MONTHS,
  MAX_AMOUNT_ROUNDING_INCREMENT,
  MAX_PAYMENT_TO_DISPOSABLE_RATIO,
  MOCK_ERROR_QUERY_PARAM,
  MOCK_ERROR_QUERY_VALUE,
  MONTHLY_EXPENSES_MAX,
  MONTHLY_EXPENSES_MIN,
  MONTHLY_INCOME_MAX,
  MONTHLY_INCOME_MIN,
  PERSONAL_LOAN_ID,
  PERSONAL_LOAN_PRODUCT,
  PERSONAL_LOAN_PURPOSES,
  RETIRED_EMPLOYMENT_SCORE,
  RISK_CATEGORY_THRESHOLDS,
  UNEMPLOYED_EMPLOYMENT_SCORE,
  SIMULATED_LATENCY_MS,
  SPEC_SAMPLE_REQUEST,
  TEST_LATENCY_MS,
  UNKNOWN_CREDIT_SCORE_RATE_PERCENT,
} from './config';

export type {
  AffordabilityAnalysis,
  AffordabilityScore,
  ApiErrorBody,
  ApiErrorCode,
  CalculateRateRequest,
  CalculateRateResponse,
  CreditScoreRateBand,
  EligibilityRequest,
  EligibilityResponse,
  EligibilityResult,
  EmploymentStatus,
  FieldErrorMap,
  FinancialInfo,
  InterestRateRange,
  LoanDetails,
  LoanProduct,
  LoanPurpose,
  LoanType,
  NumericFieldRule,
  PaymentScheduleEntry,
  PersonalInfo,
  PersonalLoanPurpose,
  ProductsResponse,
  RecommendedLoan,
  RiskCategory,
  ValidationRules,
  ValidationRulesResponse,
  VehicleLoanPurpose,
} from './types';
