export type EmploymentStatus =
  | 'employed'
  | 'self_employed'
  | 'unemployed'
  | 'retired';

export type PersonalLoanPurpose =
  | 'debt_consolidation'
  | 'home_improvement'
  | 'education'
  | 'medical'
  | 'other';

export type VehicleLoanPurpose = 'new_vehicle' | 'used_vehicle';

export type LoanPurpose = PersonalLoanPurpose | VehicleLoanPurpose;

export type LoanType = 'personal_loan' | 'vehicle_loan';

export type RiskCategory = 'low' | 'medium' | 'high';

export type AffordabilityScore = 'excellent' | 'good' | 'fair' | 'poor';

export type ApiErrorCode = 'VALIDATION_ERROR' | 'INTERNAL_ERROR';

export interface PersonalInfo {
  age: number;
  employmentStatus: EmploymentStatus;
  /** Months. Omitted for unemployed and retired (SI-3). */
  employmentDuration?: number;
}

export interface FinancialInfo {
  monthlyIncome: number;
  monthlyExpenses: number;
  /** Outstanding balance in rand, not a monthly repayment (SI-7). */
  existingDebt: number;
  /** FICO-like 300–850. Omit when unknown; never send 0 or null (SI-8, SI-16). */
  creditScore?: number;
}

export interface LoanDetails {
  requestedAmount: number;
  /** Months (SI-5). */
  loanTerm: number;
  loanPurpose: LoanPurpose;
}

export interface EligibilityRequest {
  personalInfo: PersonalInfo;
  financialInfo: FinancialInfo;
  loanDetails: LoanDetails;
}

export interface EligibilityResult {
  isEligible: boolean;
  approvalLikelihood: number;
  riskCategory: RiskCategory;
  decisionReason: string;
}

export interface RecommendedLoan {
  maxAmount: number;
  recommendedAmount: number;
  interestRate: number;
  monthlyPayment: number;
  totalRepayment: number;
}

export interface AffordabilityAnalysis {
  disposableIncome: number;
  debtToIncomeRatio: number;
  loanToIncomeRatio: number;
  affordabilityScore: AffordabilityScore;
}

export interface EligibilityResponse {
  eligibilityResult: EligibilityResult;
  recommendedLoan: RecommendedLoan;
  affordabilityAnalysis: AffordabilityAnalysis;
}

export interface CalculateRateRequest {
  loanAmount: number;
  loanTerm: number;
  creditScore?: number;
  loanType: LoanType;
}

export interface PaymentScheduleEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface CalculateRateResponse {
  interestRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  paymentSchedule: PaymentScheduleEntry[];
}

export interface InterestRateRange {
  min: number;
  max: number;
}

export interface LoanProduct {
  id: LoanType;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  interestRateRange: InterestRateRange;
  purposes: readonly LoanPurpose[];
}

export interface ProductsResponse {
  products: LoanProduct[];
}

export interface NumericFieldRule {
  min?: number;
  max?: number;
  required: boolean;
  errorMessage: string;
}

export interface EnumFieldRule<T extends string = string> {
  required: boolean;
  options: readonly T[];
  errorMessage: string;
}

export interface ValidationRules {
  personalInfo: {
    age: NumericFieldRule;
    employmentStatus: EnumFieldRule<EmploymentStatus>;
    employmentDuration: NumericFieldRule;
  };
  financialInfo: {
    monthlyIncome: NumericFieldRule;
    monthlyExpenses: NumericFieldRule;
    creditScore: NumericFieldRule;
  };
  loanDetails: {
    requestedAmount: NumericFieldRule;
    loanTerm: NumericFieldRule;
  };
}

export interface ValidationRulesResponse {
  personalInfo: ValidationRules['personalInfo'];
  financialInfo: ValidationRules['financialInfo'];
  loanDetails: ValidationRules['loanDetails'];
}

export interface FieldErrorMap {
  [path: string]: string;
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    fieldErrors?: FieldErrorMap;
  };
}

export interface CreditScoreRateBand {
  minScore: number;
  annualRatePercent: number;
}
