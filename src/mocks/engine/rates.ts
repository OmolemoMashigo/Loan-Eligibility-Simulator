import {
  CREDIT_SCORE_RATE_BANDS,
  PERSONAL_LOAN_PRODUCT,
  UNKNOWN_CREDIT_SCORE_RATE_PERCENT,
} from './config';
import type { InterestRateRange } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function bandRateForScore(creditScore: number): number {
  const match = CREDIT_SCORE_RATE_BANDS.find(
    (band) => creditScore >= band.minScore,
  );

  return match?.annualRatePercent ?? UNKNOWN_CREDIT_SCORE_RATE_PERCENT;
}

/**
 * SI-8: omitted scores use the unknown band.
 * Result is always clamped to the product rate range.
 */
export function selectAnnualInterestRate(
  creditScore: number | undefined,
  rateRange: InterestRateRange = PERSONAL_LOAN_PRODUCT.interestRateRange,
): number {
  const rawRate =
    creditScore === undefined || Number.isNaN(creditScore)
      ? UNKNOWN_CREDIT_SCORE_RATE_PERCENT
      : bandRateForScore(creditScore);

  return clamp(rawRate, rateRange.min, rateRange.max);
}
