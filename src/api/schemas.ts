import { z } from 'zod';

export const loanTypeSchema = z.enum(['personal_loan', 'vehicle_loan']);

export const employmentStatusSchema = z.enum([
  'employed',
  'self_employed',
  'unemployed',
  'retired',
]);

export const personalLoanPurposeSchema = z.enum([
  'debt_consolidation',
  'home_improvement',
  'education',
  'medical',
  'other',
]);

export const vehicleLoanPurposeSchema = z.enum(['new_vehicle', 'used_vehicle']);

export const loanPurposeSchema = z.union([
  personalLoanPurposeSchema,
  vehicleLoanPurposeSchema,
]);

export const riskCategorySchema = z.enum(['low', 'medium', 'high']);

export const affordabilityScoreSchema = z.enum([
  'excellent',
  'good',
  'fair',
  'poor',
]);

export const interestRateRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
});

export const loanProductSchema = z.object({
  id: loanTypeSchema,
  name: z.string(),
  description: z.string(),
  minAmount: z.number(),
  maxAmount: z.number(),
  minTerm: z.number(),
  maxTerm: z.number(),
  interestRateRange: interestRateRangeSchema,
  purposes: z.array(loanPurposeSchema),
});

export const productsResponseSchema = z.object({
  products: z.array(loanProductSchema).min(1),
});

export const numericFieldRuleSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  required: z.boolean(),
  errorMessage: z.string(),
});

export const enumFieldRuleSchema = z.object({
  required: z.boolean(),
  options: z.array(z.string()).min(1),
  errorMessage: z.string(),
});

export const validationRulesResponseSchema = z.object({
  personalInfo: z.object({
    age: numericFieldRuleSchema,
    employmentStatus: enumFieldRuleSchema,
    employmentDuration: numericFieldRuleSchema,
  }),
  financialInfo: z.object({
    monthlyIncome: numericFieldRuleSchema,
    monthlyExpenses: numericFieldRuleSchema,
    creditScore: numericFieldRuleSchema,
  }),
  loanDetails: z.object({
    requestedAmount: numericFieldRuleSchema,
    loanTerm: numericFieldRuleSchema,
  }),
});

export const eligibilityResultSchema = z.object({
  isEligible: z.boolean(),
  approvalLikelihood: z.number(),
  riskCategory: riskCategorySchema,
  decisionReason: z.string(),
});

export const recommendedLoanSchema = z.object({
  maxAmount: z.number(),
  recommendedAmount: z.number(),
  interestRate: z.number(),
  monthlyPayment: z.number(),
  totalRepayment: z.number(),
});

export const affordabilityAnalysisSchema = z.object({
  disposableIncome: z.number(),
  debtToIncomeRatio: z.number(),
  loanToIncomeRatio: z.number(),
  affordabilityScore: affordabilityScoreSchema,
});

export const eligibilityResponseSchema = z.object({
  eligibilityResult: eligibilityResultSchema,
  recommendedLoan: recommendedLoanSchema,
  affordabilityAnalysis: affordabilityAnalysisSchema,
});

export const paymentScheduleEntrySchema = z.object({
  month: z.number(),
  payment: z.number(),
  principal: z.number(),
  interest: z.number(),
  balance: z.number(),
});

export const calculateRateResponseSchema = z.object({
  interestRate: z.number(),
  monthlyPayment: z.number(),
  totalInterest: z.number(),
  totalRepayment: z.number(),
  paymentSchedule: z.array(paymentScheduleEntrySchema).min(1),
});

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.enum(['VALIDATION_ERROR', 'INTERNAL_ERROR']),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.string()).optional(),
  }),
});

export type LoanType = z.infer<typeof loanTypeSchema>;
export type EmploymentStatus = z.infer<typeof employmentStatusSchema>;
export type LoanPurpose = z.infer<typeof loanPurposeSchema>;
export type ProductsResponse = z.infer<typeof productsResponseSchema>;
export type ValidationRulesResponse = z.infer<
  typeof validationRulesResponseSchema
>;
export type EligibilityResponse = z.infer<typeof eligibilityResponseSchema>;
export type CalculateRateResponse = z.infer<typeof calculateRateResponseSchema>;
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export type EligibilityRequest = {
  personalInfo: {
    age: number;
    employmentStatus: EmploymentStatus;
    employmentDuration?: number;
  };
  financialInfo: {
    monthlyIncome: number;
    monthlyExpenses: number;
    existingDebt: number;
    creditScore?: number;
  };
  loanDetails: {
    requestedAmount: number;
    loanTerm: number;
    loanPurpose: LoanPurpose;
  };
};

export type CalculateRateRequest = {
  loanAmount: number;
  loanTerm: number;
  creditScore?: number;
  loanType: LoanType;
};
