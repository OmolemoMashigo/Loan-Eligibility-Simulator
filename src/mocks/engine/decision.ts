import { analyseAffordability } from './affordability';
import { calculateAmortisationSchedule } from './amortisation';
import {
  APPROVAL_SCORE_WEIGHTS,
  CREDIT_RATE_COMPONENT_SCORES,
  EMPLOYMENT_DURATION_FULL_SCORE_MONTHS,
  MAX_PAYMENT_TO_DISPOSABLE_RATIO,
  PERSONAL_LOAN_PRODUCT,
  RETIRED_EMPLOYMENT_SCORE,
  RISK_CATEGORY_THRESHOLDS,
  UNEMPLOYED_EMPLOYMENT_SCORE,
} from './config';
import { selectAnnualInterestRate } from './rates';
import type {
  EligibilityRequest,
  EligibilityResponse,
  EmploymentStatus,
  LoanProduct,
  RiskCategory,
} from './types';

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function repaymentComponent(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio >= MAX_PAYMENT_TO_DISPOSABLE_RATIO) {
    return 0;
  }

  if (ratio <= 0.4) {
    return 100;
  }

  if (ratio <= 0.72) {
    return 100 - ((ratio - 0.4) / 0.32) * 15;
  }

  return 85 - ((ratio - 0.72) / 0.13) * 45;
}

function debtToIncomeComponent(dtiPercent: number): number {
  return clampScore(100 - dtiPercent);
}

function creditComponent(annualRatePercent: number): number {
  const match = CREDIT_RATE_COMPONENT_SCORES.find(
    (band) => band.annualRatePercent === annualRatePercent,
  );

  return match?.score ?? 55;
}

function employmentComponent(
  status: EmploymentStatus,
  durationMonths: number | undefined,
): number {
  if (status === 'unemployed') {
    return UNEMPLOYED_EMPLOYMENT_SCORE;
  }

  if (status === 'retired') {
    return RETIRED_EMPLOYMENT_SCORE;
  }

  const duration = durationMonths ?? 0;

  return clampScore((duration / EMPLOYMENT_DURATION_FULL_SCORE_MONTHS) * 100);
}

export function calculateApprovalLikelihood(input: {
  repaymentToDisposableRatio: number;
  debtToIncomeRatio: number;
  annualRatePercent: number;
  employmentStatus: EmploymentStatus;
  employmentDuration?: number;
}): number {
  const weighted =
    repaymentComponent(input.repaymentToDisposableRatio) *
      (APPROVAL_SCORE_WEIGHTS.repaymentToDisposable / 100) +
    debtToIncomeComponent(input.debtToIncomeRatio) *
      (APPROVAL_SCORE_WEIGHTS.debtToIncome / 100) +
    creditComponent(input.annualRatePercent) *
      (APPROVAL_SCORE_WEIGHTS.creditBand / 100) +
    employmentComponent(input.employmentStatus, input.employmentDuration) *
      (APPROVAL_SCORE_WEIGHTS.employment / 100);

  return Math.round(clampScore(weighted));
}

export function riskFromLikelihood(likelihood: number): RiskCategory {
  if (likelihood >= RISK_CATEGORY_THRESHOLDS.low) {
    return 'low';
  }

  if (likelihood >= RISK_CATEGORY_THRESHOLDS.medium) {
    return 'medium';
  }

  return 'high';
}

function eligibleReason(risk: RiskCategory, status: EmploymentStatus): string {
  if (status === 'unemployed') {
    return 'Declared income can support this repayment, though unemployment increases the estimated risk';
  }

  if (risk === 'low') {
    return 'Strong income-to-expense ratio and manageable existing debt';
  }

  if (risk === 'medium') {
    return 'You appear able to afford this loan, with some pressure on monthly cash flow';
  }

  return 'This estimate is tight. A smaller amount or longer term would improve affordability';
}

function declineReason(
  kind: 'no-disposable' | 'repayment' | 'amount-low' | 'amount-high',
): string {
  switch (kind) {
    case 'no-disposable':
      return 'Monthly expenses leave no income for a loan repayment';
    case 'repayment':
      return 'The monthly repayment would take more than 85% of your disposable income';
    case 'amount-low':
      return `The requested amount is below the Personal Loan minimum of R${PERSONAL_LOAN_PRODUCT.minAmount.toLocaleString('en-ZA')}`;
    case 'amount-high':
      return `The requested amount is above the Personal Loan maximum of R${PERSONAL_LOAN_PRODUCT.maxAmount.toLocaleString('en-ZA')}`;
  }
}

export function evaluateEligibility(
  request: EligibilityRequest,
  product: LoanProduct = PERSONAL_LOAN_PRODUCT,
): EligibilityResponse {
  const interestRate = selectAnnualInterestRate(
    request.financialInfo.creditScore,
    product.interestRateRange,
  );
  const affordability = analyseAffordability({
    monthlyIncome: request.financialInfo.monthlyIncome,
    monthlyExpenses: request.financialInfo.monthlyExpenses,
    existingDebt: request.financialInfo.existingDebt,
    requestedAmount: request.loanDetails.requestedAmount,
    loanTerm: request.loanDetails.loanTerm,
    annualRatePercent: interestRate,
    product,
  });

  const repaymentFraction =
    affordability.disposableIncome > 0
      ? affordability.monthlyPayment / affordability.disposableIncome
      : Number.POSITIVE_INFINITY;

  let decline: ReturnType<typeof declineReason> | undefined;

  if (affordability.disposableIncome <= 0) {
    decline = declineReason('no-disposable');
  } else if (repaymentFraction > MAX_PAYMENT_TO_DISPOSABLE_RATIO) {
    decline = declineReason('repayment');
  } else if (request.loanDetails.requestedAmount < product.minAmount) {
    decline = declineReason('amount-low');
  } else if (request.loanDetails.requestedAmount > product.maxAmount) {
    decline = declineReason('amount-high');
  }

  const isEligible = decline === undefined;
  const approvalLikelihood = calculateApprovalLikelihood({
    repaymentToDisposableRatio: repaymentFraction,
    debtToIncomeRatio: affordability.debtToIncomeRatio,
    annualRatePercent: interestRate,
    employmentStatus: request.personalInfo.employmentStatus,
    employmentDuration: request.personalInfo.employmentDuration,
  });
  const riskCategory = isEligible
    ? riskFromLikelihood(approvalLikelihood)
    : 'high';

  const recommendedAmount = isEligible
    ? Math.min(request.loanDetails.requestedAmount, affordability.maxAmount)
    : affordability.maxAmount;

  const recommendedSchedule =
    recommendedAmount > 0
      ? calculateAmortisationSchedule({
          principal: recommendedAmount,
          annualRatePercent: interestRate,
          termMonths: request.loanDetails.loanTerm,
        })
      : {
          monthlyPayment: 0,
          totalRepayment: 0,
        };

  return {
    eligibilityResult: {
      isEligible,
      approvalLikelihood: isEligible
        ? approvalLikelihood
        : Math.min(approvalLikelihood, 40),
      riskCategory,
      decisionReason:
        decline ??
        eligibleReason(riskCategory, request.personalInfo.employmentStatus),
    },
    recommendedLoan: {
      maxAmount: affordability.maxAmount,
      recommendedAmount,
      interestRate,
      monthlyPayment: recommendedSchedule.monthlyPayment,
      totalRepayment: recommendedSchedule.totalRepayment,
    },
    affordabilityAnalysis: {
      disposableIncome: affordability.disposableIncome,
      debtToIncomeRatio: affordability.debtToIncomeRatio,
      loanToIncomeRatio: affordability.loanToIncomeRatio,
      affordabilityScore: affordability.affordabilityScore,
    },
  };
}
