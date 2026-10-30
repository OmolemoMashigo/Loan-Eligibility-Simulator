import {
  calculateMonthlyPayment,
  monthlyRateFromAnnualPercent,
  roundToCents,
} from './amortisation';
import {
  AFFORDABILITY_SCORE_THRESHOLDS,
  LOAN_TO_INCOME_INCOME_MONTHS,
  MAX_AMOUNT_ROUNDING_INCREMENT,
  MAX_PAYMENT_TO_DISPOSABLE_RATIO,
  PERSONAL_LOAN_PRODUCT,
} from './config';
import type { AffordabilityScore, LoanProduct } from './types';

export interface AffordabilityInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  existingDebt: number;
  requestedAmount: number;
  loanTerm: number;
  annualRatePercent: number;
  product?: LoanProduct;
}

export interface AffordabilityBreakdown {
  disposableIncome: number;
  debtToIncomeRatio: number;
  loanToIncomeRatio: number;
  repaymentToDisposableRatio: number;
  affordabilityScore: AffordabilityScore;
  monthlyPayment: number;
  maxAmount: number;
}

export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateDisposableIncome(
  monthlyIncome: number,
  monthlyExpenses: number,
): number {
  return roundToCents(monthlyIncome - monthlyExpenses);
}

export function calculateDebtToIncomeRatio(
  existingDebt: number,
  monthlyIncome: number,
): number {
  if (monthlyIncome <= 0) {
    return 0;
  }

  return roundToOneDecimal((existingDebt / monthlyIncome) * 100);
}

export function calculateLoanToIncomeRatio(
  requestedAmount: number,
  monthlyIncome: number,
): number {
  if (monthlyIncome <= 0) {
    return 0;
  }

  return roundToOneDecimal(
    (requestedAmount / (monthlyIncome * LOAN_TO_INCOME_INCOME_MONTHS)) * 100,
  );
}

export function scoreAffordability(
  repaymentToDisposableRatio: number,
): AffordabilityScore {
  if (repaymentToDisposableRatio <= AFFORDABILITY_SCORE_THRESHOLDS.excellent) {
    return 'excellent';
  }

  if (repaymentToDisposableRatio <= AFFORDABILITY_SCORE_THRESHOLDS.good) {
    return 'good';
  }

  if (repaymentToDisposableRatio <= AFFORDABILITY_SCORE_THRESHOLDS.fair) {
    return 'fair';
  }

  return 'poor';
}

function principalFromPayment(
  payment: number,
  annualRatePercent: number,
  termMonths: number,
): number {
  if (payment <= 0) {
    return 0;
  }

  const monthlyRate = monthlyRateFromAnnualPercent(annualRatePercent);

  if (monthlyRate === 0) {
    return payment * termMonths;
  }

  const growth = (1 + monthlyRate) ** termMonths;

  return (payment * (growth - 1)) / (monthlyRate * growth);
}

function roundToNearestIncrement(amount: number, increment: number): number {
  return Math.round(amount / increment) * increment;
}

/**
 * Inverse PMT at 85% of disposable, rounded to the nearest R5,000, then
 * clamped to the product. Below the product minimum is 0, not rounded up.
 */
export function calculateMaxAffordableAmount(input: {
  disposableIncome: number;
  annualRatePercent: number;
  termMonths: number;
  product?: LoanProduct;
}): number {
  const product = input.product ?? PERSONAL_LOAN_PRODUCT;

  if (input.disposableIncome <= 0) {
    return 0;
  }

  const maxPayment = input.disposableIncome * MAX_PAYMENT_TO_DISPOSABLE_RATIO;
  const unrounded = principalFromPayment(
    maxPayment,
    input.annualRatePercent,
    input.termMonths,
  );

  if (unrounded < product.minAmount) {
    return 0;
  }

  const rounded = roundToNearestIncrement(
    unrounded,
    MAX_AMOUNT_ROUNDING_INCREMENT,
  );

  return Math.min(product.maxAmount, Math.max(product.minAmount, rounded));
}

export function analyseAffordability(
  input: AffordabilityInput,
): AffordabilityBreakdown {
  const product = input.product ?? PERSONAL_LOAN_PRODUCT;
  const disposableIncome = calculateDisposableIncome(
    input.monthlyIncome,
    input.monthlyExpenses,
  );
  const monthlyPayment = calculateMonthlyPayment({
    principal: input.requestedAmount,
    annualRatePercent: input.annualRatePercent,
    termMonths: input.loanTerm,
  });
  const repaymentToDisposableRatio =
    disposableIncome > 0
      ? monthlyPayment / disposableIncome
      : Number.POSITIVE_INFINITY;
  const finiteRepaymentRatio = Number.isFinite(repaymentToDisposableRatio)
    ? repaymentToDisposableRatio
    : Number.POSITIVE_INFINITY;

  return {
    disposableIncome,
    debtToIncomeRatio: calculateDebtToIncomeRatio(
      input.existingDebt,
      input.monthlyIncome,
    ),
    loanToIncomeRatio: calculateLoanToIncomeRatio(
      input.requestedAmount,
      input.monthlyIncome,
    ),
    repaymentToDisposableRatio: Number.isFinite(finiteRepaymentRatio)
      ? roundToOneDecimal(finiteRepaymentRatio * 100)
      : 0,
    affordabilityScore: scoreAffordability(
      Number.isFinite(finiteRepaymentRatio) ? finiteRepaymentRatio : 1,
    ),
    monthlyPayment,
    maxAmount: calculateMaxAffordableAmount({
      disposableIncome,
      annualRatePercent: input.annualRatePercent,
      termMonths: input.loanTerm,
      product,
    }),
  };
}
